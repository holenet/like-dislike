import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import classNames from "classnames";
import { Topic } from "./model";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const COLORS = ["bg-red-400", "bg-blue-400", "bg-green-400", "bg-orange-400", "bg-purple-400", "bg-yellow-400"];

type Props = {
  topic: Topic;
  colorOffset: number;
};
export function TopicEntry({ topic: _topic, colorOffset }: Props) {
  const connectedWebSocket = useRef<WebSocket>();
  const topic = useSignal<Topic>();

  useEffect(() => {
    topic.value = _topic;
    fetchTopic().then(() => openWebsocket());
  }, [_topic]);
  useEffect(() => {
    return () => {
      if (connectedWebSocket.current) connectedWebSocket.current.close();
    };
  }, []);

  const fetchTopic = async () => {
    const url = `${API_BASE_URL}/topic/${topic.value.Id}`;
    const res = await fetch(url);
    const data = await res.json();
    topic.value = data;
  };

  const openWebsocket = () => {
    if (connectedWebSocket.current) connectedWebSocket.current.close();
    const conn = new WebSocket(`${API_BASE_URL}/ws/${topic.value.Id}`);
    conn.onopen = (ev: Event) => {
      // connected.value = true;
    };
    conn.onerror = (ev: Event) => {
      // alert(ev);
    };
    conn.onclose = (ev: Event) => {
      // alert(ev);
    };
    conn.onmessage = (ev: MessageEvent) => {
      const votes = JSON.parse(ev.data);
      topic.value = {
        ...topic.value,
        Votes: topic.value.Votes.map((v, i) => Math.max(v, votes[i])),
      };
    };
    connectedWebSocket.current = conn;
  };

  const vote = (index: number) => {
    const url = `${API_BASE_URL}/topic/${topic.value.Id}/vote/${index}`;
    fetch(url, { method: "POST" }).then(async (res) => {
      const votes = await res.json();
      topic.value = {
        ...topic.value,
        Votes: topic.value.Votes.map((v, i) => Math.max(v, votes[i])),
      };
    });
  };

  return (
    <div class="flex flex-col w-full h-full justify-center items-center">
      {topic.value && (
        <div class="flex flex-col w-full gap-6">
          <div class="font-bold text-lg text-neutral-700 text-wrap w-full break-words">{topic.value.Content}</div>
          <div class="flex flex-col gap-1">
            {topic.value.Choices.map((choice, i) => (
              <>
                {i !== 0 && <span class="opacity-80">vs</span>}
                <button
                  className={classNames(
                    "rounded-full shadow-md px-8 py-2 font-bold text-white hover:scale-110 transition-all",
                    COLORS[(i + colorOffset) % COLORS.length]
                  )}
                  onClick={() => vote(i)}
                >
                  {choice}: {topic.value.Votes[i]}
                </button>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
