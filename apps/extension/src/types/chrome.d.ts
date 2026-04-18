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

    const sendMessage: (message: unknown, responseCallback?: (response?: unknown) => void) => void;
  }
}
