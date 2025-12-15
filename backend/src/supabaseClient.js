import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxegxtsndzuxmxdittgg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZWd4dHNuZHp1eG14ZGl0dGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQyMzcwNCwiZXhwIjoyMDgwOTk5NzA0fQ.FtVC9etYvnAtrEdglOXSE7mU4upPuA05nNO3lhQAfYQ';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
