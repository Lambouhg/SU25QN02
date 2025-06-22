import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jttkgezbsammnsrmfano.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dGtnZXpic2FtbW5zcm1mYW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkzNjA4MiwiZXhwIjoyMDYyNTEyMDgyfQ.s2YB5WANLfDutpW0o0huBCXvBathSdwf0yhkjhpWBlE'
export const supabase = createClient(supabaseUrl, serviceRoleKey);