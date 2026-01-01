-- Add audio_url column to pep_talks table for storing TTS audio files
alter table pep_talks
add column audio_url text;

-- Create storage bucket for pep talk audio files
insert into storage.buckets (id, name, public)
values ('pep-talk-audio', 'pep-talk-audio', true)
on conflict (id) do nothing;

-- Storage policies: Users can upload/read/delete their own audio files
create policy "Users can upload their own pep talk audio"
  on storage.objects for insert
  with check (
    bucket_id = 'pep-talk-audio' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own pep talk audio"
  on storage.objects for select
  using (
    bucket_id = 'pep-talk-audio' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own pep talk audio"
  on storage.objects for delete
  using (
    bucket_id = 'pep-talk-audio' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own pep talk audio"
  on storage.objects for update
  using (
    bucket_id = 'pep-talk-audio' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
