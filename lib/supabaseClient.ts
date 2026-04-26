import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createNoopChannel() {
  return {
    on() {
      return this;
    },
    subscribe(callback?: (status: string) => void) {
      callback?.("CLOSED");
      return this;
    },
    track() {
      return Promise.resolve({ error: null });
    },
    send() {
      return Promise.resolve("ok");
    },
    unsubscribe() {
      return Promise.resolve("ok");
    },
    presenceState() {
      return {};
    },
  };
}

function createNoopQuery() {
  return {
    select() {
      return this;
    },
    insert() {
      return this;
    },
    update() {
      return this;
    },
    delete() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    single() {
      return Promise.resolve({ data: null, error: null });
    },
    then(resolve: (value: { data: null; error: null }) => unknown) {
      return Promise.resolve(resolve({ data: null, error: null }));
    },
  };
}

const noopClient = {
  channel() {
    return createNoopChannel();
  },
  from() {
    return createNoopQuery();
  },
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (noopClient as unknown as ReturnType<typeof createClient>);
