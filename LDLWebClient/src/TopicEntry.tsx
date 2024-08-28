import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { ChoiceEntry } from "./ChoiceEntry";
import { useLocalStorageState } from "./hooks";
import { Topic } from "./model";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BG_COLORS = [
  "bg-red-300",
  "bg-blue-300",
  "bg-green-300",
  "bg-orange-300",
  "bg-purple-300",
  "bg-yellow-200",
];
const COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-yellow-500",
];

type Props = {
  topic: Topic;
  colorOffset: number;
};
export function TopicEntry({ topic: _topic, colorOffset }: Props) {
  const connectedWebSocket = useRef<WebSocket>();
  const topic = useSignal<Topic>();
  const totalVoteCount = useComputed(() =>
    topic.value.Votes.reduce((a, x) => a + x, 0)
  );
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
    const conn = new WebSocket(
      `${API_BASE_URL.replace("http", "ws")}/ws/${topic.value.Id}`
    );
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
          <div class="font-bold text-lg text-neutral-700 text-wrap w-full break-words">
            {topic.value.Content}
          </div>
          <div class="flex flex-col gap-1">
            {topic.value.Choices.map((choice, i) => (
              <ChoiceEntry
                choice={choice}
                voteCount={topic.value.Votes[i]}
                totalVoteCount={totalVoteCount.value}
                voteRecord={voteRecord[i]}
                bgColor={BG_COLORS[(i + colorOffset) % BG_COLORS.length]}
                color={COLORS[(i + colorOffset) % COLORS.length]}
                onChoiceClicked={() => vote(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
