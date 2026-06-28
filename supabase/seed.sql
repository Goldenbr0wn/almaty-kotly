insert into public.admin_users(email, active)
values ('owner@example.com', true)
on conflict (email) do update set active = excluded.active;
