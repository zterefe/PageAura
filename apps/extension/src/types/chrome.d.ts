declare namespace chrome {
  namespace runtime {
    type MessageSender = {
      id?: string;
      url?: string;
    };

    const onInstalled: {
      addListener(callback: () => void): void;
    };

    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void,
        ) => boolean | void,
      ): void;
    };

    const sendMessage: {
      (message: unknown, responseCallback: (response?: unknown) => void): void;
      <T = unknown>(message: unknown): Promise<T>;
    };
  }

  namespace storage {
    namespace local {
      function get(key: string): Promise<Record<string, unknown>>;
      function set(items: Record<string, unknown>): Promise<void>;
    }
  }

  namespace tabs {
    type Tab = {
      id?: number;
      url?: string;
      active?: boolean;
    };

    function query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>;
  }
}
