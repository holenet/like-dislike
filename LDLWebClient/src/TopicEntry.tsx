import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import classNames from "classnames";
import { Topic } from "./model";
import { useLocalStorageState } from "./hooks";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BG_COLORS = ["bg-red-300", "bg-blue-300", "bg-green-300", "bg-orange-300", "bg-purple-300", "bg-yellow-200"];
const COLORS = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500", "bg-yellow-500"];

type Props = {
  topic: Topic;
  colorOffset: number;
};
export function TopicEntry({ topic: _topic, colorOffset }: Props) {
  const connectedWebSocket = useRef<WebSocket>();
  const topic = useSignal<Topic>();
  const votePercentages = useComputed(() => {
    const sum = topic.value.Votes.reduce((a, x) => a + x, 0);
    if (sum === 0) return topic.value.Votes.map((_) => 0);
    return topic.value.Votes.map((v) => v / sum);
  });
  const [voteRecord, setVoteRecord] = useLocalStorageState<number[]>(
    `vote-record-${_topic.Id}`,
    _topic.Votes.map((_) => 0)
  );

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
    const conn = new WebSocket(`${API_BASE_URL.replace("http", "ws")}/ws/${topic.value.Id}`);
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
      setVoteRecord(voteRecord.map((v, i) => (i === index ? v + 1 : v)));
    });
  };

  return (
    <div class="flex flex-col w-full h-full justify-center items-center">
      {topic.value && (
        <div class="flex flex-col w-full gap-2">
          <div class="font-bold text-lg text-neutral-700 text-wrap w-full break-words">{topic.value.Content}</div>
          <div class="flex flex-col gap-1">
            {topic.value.Choices.map((choice, i) => (
              <>
                <button
                  className={classNames(
                    "rounded-xl shadow-sm px-4 py-2 hover:scale-[1.03] transition-all flex flex-col items-stretch gap-1 relative overflow-hidden",
                    BG_COLORS[(i + colorOffset) % COLORS.length]
                  )}
                  onClick={() => vote(i)}
                >
                  <div
                    className={classNames(
                      "absolute top-0 left-0 h-full w-full z-10",
                      COLORS[(i + colorOffset) % COLORS.length]
                    )}
                    style={{
                      transition: "transform 750ms, background-color 150ms",
                      transform: `translateX(${-100 + votePercentages.value[i] * 100}%)`,
                      filter: "saturate(75%) brightness(120%)",
                    }}
                  ></div>
                  <div class="h-full w-full z-20" style="text-shadow: 0 0 2px #00000042">
                    <div class="font-bold text-white text-start break-words">{choice}</div>
                    <div class="flex flex-row items-baseline flex-wrap justify-between">
                      <div class="font-bold text-white">
                        {topic.value.Votes[i]}
                        <span class="text-xs ml-0.5">Votes</span>
                      </div>
                      <div className={"font-bold text-white"}>{(votePercentages.value[i] * 100).toFixed(1)}%</div>
                    </div>
                    <div
                      className={classNames("text-white text-xs font-bold text-start pb-1", {
                        "opacity-0": voteRecord[i] === 0,
                        "opacity-85": voteRecord[i] > 0,
                      })}
                    >
                      +{voteRecord[i]} by you
                    </div>
                  </div>
                </button>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
