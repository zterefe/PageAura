declare namespace chrome {

  namespace storage {
    namespace local {
      const get: (keys?: string | string[] | Record<string, unknown> | null) => Promise<Record<string, unknown>>;
      const set: (items: Record<string, unknown>) => Promise<void>;
    }
  }

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

    const sendMessage: (message: unknown, responseCallback?: (response?: unknown) => void) => void;
  }
}
