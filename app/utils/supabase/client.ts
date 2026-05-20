"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://ipxadfapzgyyquznmxqf.supabase.co"

const supabaseKey =
  "sb_publishable_qU7HvW9BCxxP7cC7lfkVZA_kfE5lblA"

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)