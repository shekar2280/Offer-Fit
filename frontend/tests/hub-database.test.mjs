import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";

test("job hub migration enforces ownership, transactional updates, and durable limits", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
      create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
      grant usage on schema storage to authenticated; grant select,insert,delete on storage.objects to authenticated;
      insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
    await db.exec(
      await fs.readFile(
        "../supabase/migrations/202610080001_job_hub.sql",
        "utf8",
      ),
    );
    const readiness = await db.exec(
      await fs.readFile("../supabase/verify_job_hub.sql", "utf8"),
    );
    assert.equal(readiness[0].rows.length, 9);
    assert.ok(readiness[0].rows.every((row) => row.table_exists && row.rls_enabled));
    assert.equal(readiness[1].rows.length, 9);
    assert.ok(readiness[1].rows.every((row) => row.function_exists));
    assert.equal(readiness[2].rows.length, 1);
    assert.equal(readiness[2].rows[0].publicly_accessible, false);
    const user1 = "11111111-1111-4111-8111-111111111111";
    const user2 = "22222222-2222-4222-8222-222222222222";
    const asUser = async (id) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    };
    await asUser(user1);
    const app = (
      await db.query(
        "insert into public.hub_applications(user_id,company,role,status,applied_at) values($1,'Acme','Engineer','applied',now()-interval '15 days') returning id",
        [user1],
      )
    ).rows[0].id;
    await db.query(
      "update public.hub_applications set status='interview' where id=$1",
      [app],
    );
    const current = (
      await db.query(
        "select revision from public.hub_applications where id=$1",
        [app],
      )
    ).rows[0];
    assert.equal(current.revision, 1);
    assert.equal(
      (
        await db.query(
          "select * from public.hub_events where application_id=$1",
          [app],
        )
      ).rows.length,
      2,
    );
    await assert.rejects(
      () =>
        db.query(
          "insert into public.hub_applications(user_id,company,role) values($1,'Other','Engineer')",
          [user2],
        ),
      /row-level security/,
    );
    await assert.rejects(
      () => db.query("select * from public.hub_credentials"),
      /permission denied/,
    );
    await assert.rejects(
      () => db.query("update public.hub_events set new_status='offer'"),
      /permission denied/,
    );
    await asUser(user2);
    assert.equal(
      (await db.query("select * from public.hub_applications")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.hub_events")).rows.length,
      0,
    );
    const resume = (
      await db.query(
        "insert into public.hub_resumes(user_id,name,content) values($1,'Private','My resume') returning id",
        [user2],
      )
    ).rows[0].id;
    await asUser(user1);
    await assert.rejects(
      () =>
        db.query(
          "update public.hub_applications set resume_id=$1 where id=$2",
          [resume, app],
        ),
      /foreign key/,
    );
    await db.query("select public.hub_checkin()");
    await db.query("select public.hub_checkin()");
    assert.equal(
      (await db.query("select * from public.hub_checkins")).rows.length,
      1,
    );
    for (let i = 0; i < 20; i++)
      assert.equal(
        (await db.query("select public.hub_consume_limit('ai') as allowed"))
          .rows[0].allowed,
        true,
      );
    assert.equal(
      (await db.query("select public.hub_consume_limit('ai') as allowed"))
        .rows[0].allowed,
      false,
    );
    assert.equal(
      (await db.query("select public.hub_consume_limit('unknown') as allowed"))
        .rows[0].allowed,
      false,
    );
    const draft = (
      await db.query(
        "insert into public.hub_drafts(user_id,application_id,subject,body) values($1,$2,'Hello','My draft') returning id",
        [user1, app],
      )
    ).rows[0].id;
    assert.equal(
      (await db.query("select public.hub_mark_sent($1) as ok", [draft])).rows[0]
        .ok,
      true,
    );
    assert.equal(
      (
        await db.query(
          "select status from public.hub_applications where id=$1",
          [app],
        )
      ).rows[0].status,
      "interview",
    );
    const firstSent = (
      await db.query("select sent_at from public.hub_drafts where id=$1", [
        draft,
      ])
    ).rows[0].sent_at;
    await db.query("select public.hub_mark_sent($1)", [draft]);
    assert.deepEqual(
      (
        await db.query("select sent_at from public.hub_drafts where id=$1", [
          draft,
        ])
      ).rows[0].sent_at,
      firstSent,
    );
    await assert.rejects(
      () =>
        db.query(
          "update public.hub_resumes set content='changed' where id=$1",
          [resume],
        ),
      /permission denied/,
    );
    await assert.rejects(
      () => db.query("select public.hub_claim_mailboxes()"),
      /permission denied/,
    );
    await assert.rejects(
      () =>
        db.query("select public.hub_store_sync_batch($1,now(),'[]','{}')", [
          user1,
        ]),
      /permission denied/,
    );
    await db.exec("reset role");
    const oldMail = (
      await db.query(
        "insert into public.hub_email_updates(user_id,application_id,message_id,mailbox,subject,proposed_status,evidence,received_at) values($1,$2,'old','a@gmail.com','Acknowledgement','acknowledged','Received',now()-interval '1 day') returning id",
        [user1, app],
      )
    ).rows[0].id;
    await asUser(user1);
    assert.equal(
      (
        await db.query("select public.hub_resolve_email($1,'applied') as ok", [
          oldMail,
        ])
      ).rows[0].ok,
      false,
    );
    assert.equal(
      (
        await db.query(
          "select public.hub_resolve_email($1,'dismissed') as ok",
          [oldMail],
        )
      ).rows[0].ok,
      true,
    );
    await assert.rejects(
      () =>
        db.query(
          "insert into storage.objects(bucket_id,name) values('hub-resumes',$1)",
          [`${user2}/resume.docx`],
        ),
      /row-level security/,
    );
    await db.query(
      "insert into storage.objects(bucket_id,name) values('hub-resumes',$1)",
      [`${user1}/resume.docx`],
    );
    await asUser(user2);
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
    await db.exec('reset role');
    const connection=(await db.query("insert into public.hub_credentials(user_id,kind,secret,metadata) values($1,'gmail','test-envelope','{\"email\":\"test@example.com\",\"background_sync\":true}') returning updated_at",[user1])).rows[0];
    await db.query('insert into public.hub_mailbox_jobs(user_id) values($1)',[user1]);
    await db.exec('set role service_role');
    assert.equal((await db.query('select * from public.hub_claim_mailboxes()')).rows.length,1);
    assert.equal((await db.query('select * from public.hub_claim_mailboxes()')).rows.length,0);
    assert.equal((await db.query("select public.hub_store_sync_batch($1,$2,'[]','{\"email\":\"test@example.com\",\"background_sync\":true}') as ok",[user1,connection.updated_at])).rows[0].ok,true);
    assert.equal((await db.query("select public.hub_store_sync_batch($1,$2,'[]','{}') as ok",[user1,connection.updated_at])).rows[0].ok,false);
    await asUser(user1);
    await db.query('select public.hub_purge_own_data()');
    assert.equal((await db.query('select * from public.hub_applications')).rows.length,0);
    await asUser(user2);
    assert.equal((await db.query('select * from public.hub_resumes')).rows.length,1);
  } finally {
    await db.close();
  }
});
