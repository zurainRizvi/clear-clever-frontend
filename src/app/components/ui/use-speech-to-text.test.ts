import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSpeechToText } from "./use-speech-to-text";

vi.mock("@/lib/speech-to-text/speech-feedback", () => ({
  playMicStartTone: vi.fn(),
  playMicStopTone: vi.fn(),
}));

type MockRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
};

function createMockRecognition(): MockRecognition {
  let hasDeliveredResult = false;
  return {
    lang: "",
    continuous: false,
    interimResults: false,
    maxAlternatives: 1,
    onresult: null,
    onerror: null,
    onend: null,
    start: vi.fn(function start(this: MockRecognition) {
      if (hasDeliveredResult) return;
      hasDeliveredResult = true;
      this.onresult?.({
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            length: 1,
            0: { transcript: "hello world", confidence: 1 },
            item: (index: number) =>
              index === 0 ? { transcript: "hello world", confidence: 1 } : { transcript: "", confidence: 0 },
          },
        ],
      } as SpeechRecognitionEvent);
      this.onend?.();
    }),
    stop: vi.fn(function stop(this: MockRecognition) {
      this.onend?.();
    }),
    abort: vi.fn(),
  };
}

describe("useSpeechToText", () => {
  let mockRecognition: MockRecognition;

  beforeEach(() => {
    mockRecognition = createMockRecognition();
    class MockSpeechRecognition {
      constructor() {
        return mockRecognition;
      }
    }
    vi.stubGlobal("SpeechRecognition", MockSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", MockSpeechRecognition);
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: ["en-PK", "en"],
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("starts unsupported when SpeechRecognition is unavailable", () => {
    vi.stubGlobal("SpeechRecognition", undefined);
    vi.stubGlobal("webkitSpeechRecognition", undefined);

    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechToText({ onTranscript }));

    expect(result.current.isSupported).toBe(false);
    expect(result.current.status).toBe("unsupported");
  });

  it("calls onTranscript only with final text, not interim", async () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechToText({ onTranscript }));

    await act(async () => {
      await result.current.startListening();
    });

    await act(async () => {
      result.current.stopListening();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    expect(onTranscript).toHaveBeenCalledTimes(1);
    expect(onTranscript).toHaveBeenCalledWith("hello world");
    expect(mockRecognition.continuous).toBe(false);
    expect(mockRecognition.lang).toBe("en-PK");
  });

  it("stops listening when stopListening is called", async () => {
    mockRecognition.start = vi.fn(function start(this: MockRecognition) {
      // keep listening until stop is invoked
    });

    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechToText({ onTranscript }));

    await act(async () => {
      await result.current.startListening();
    });

    expect(result.current.status).toBe("listening");

    act(() => {
      result.current.stopListening();
    });

    expect(mockRecognition.stop).toHaveBeenCalledTimes(1);
  });
});
