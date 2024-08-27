import { useSignal } from "@preact/signals";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import "./style.css";
import { Topic } from "./model";
import { TopicEntry } from "./TopicEntry";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const topics = useSignal<Topic[]>([]);
  const currentIndex = useSignal(0);

  useEffect(() => {
    fetchTopicList();
  }, []);

  const fetchTopicList = async () => {
    const url = `${API_BASE_URL}/topic`;
    const res = await fetch(url);
    topics.value = await res.json();
  };

  const deleteTopic = async (topicId: number) => {
    const url = `${API_BASE_URL}/topic/${topicId}`;
    try {
      await fetch(url, { method: "DELETE" });
      topics.value = topics.value.filter((t) => t.Id !== topicId);
      currentIndex.value = Math.min(currentIndex.value, topics.value.length - 1);
    } catch (e) {
      console.log("delete error", e);
    }
  };

  const [contentForm, setContentForm] = useState("");
  const [choiceAForm, setChoiceAForm] = useState("");
  const [choiceBForm, setChoiceBForm] = useState("");

  const addTopic = async (e: Event) => {
    e.preventDefault();
    const url = `${API_BASE_URL}/topic`;
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        Content: contentForm,
        Choices: [choiceAForm, choiceBForm],
      }),
    });
    const topic = await res.json();
    topics.value = [...topics.value, topic];
    currentIndex.value = topics.value.length - 1;
    setContentForm("");
    setChoiceAForm("");
    setChoiceBForm("");
  };

  return (
    <div class="flex flex-col w-full h-full justify-center items-center gap-16">
      {topics.value.length > 0 && (
        <div class="flex flex-row  justify-center items-center gap-4">
          <button
            class="shadow-md bg-neutral-300 text-white rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition-all"
            onClick={() => (currentIndex.value = (currentIndex.value - 1 + topics.value.length) % topics.value.length)}
          >
            ◀
          </button>
          {topics.value
            .map((topic, i) => (
              <div class="shadow-md bg-white rounded-2xl p-4 w-64 relative overflow-hidden">
                <button
                  class="absolute top-1.5 right-1.5 bg-neutral-400 text-white font-bold text-sm rounded-full px-1.5 py-0.5 flex items-center justify-center shadow-sm hover:scale-110 transition-all w-6 h-6"
                  onClick={() => deleteTopic(topic.Id)}
                >
                  X
                </button>
                <TopicEntry
                  topic={topic}
                  colorOffset={topics.value.slice(0, i).reduce((a, x) => a + x.Choices.length, 0)}
                />
              </div>
            ))
            .slice(currentIndex.value, currentIndex.value + 1)}
          <button
            class="shadow-md bg-neutral-300 text-white rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition-all"
            onClick={() => (currentIndex.value = (currentIndex.value + 1) % topics.value.length)}
          >
            ▶
          </button>
        </div>
      )}
      <div class="shadow-md bg-white rounded-2xl p-4">
        <form class="flex flex-col gap-1">
          <div class="flex gap-1">
            <div class="w-16 text-right text-neutral-600">토픽:</div>
            <input
              class="outline-none border border-neutral-300 rounded-md shadow-sm px-1"
              value={contentForm}
              onInput={(e) => setContentForm(e.currentTarget.value)}
            />
          </div>
          <div class="flex gap-1">
            <div class="w-16 text-right text-neutral-600">선택지A:</div>
            <input
              class="outline-none border border-neutral-300 rounded-md shadow-sm px-1"
              value={choiceAForm}
              onInput={(e) => setChoiceAForm(e.currentTarget.value)}
            />
          </div>
          <div class="flex gap-1">
            <div class="w-16 text-right text-neutral-600">선택지B:</div>
            <input
              class="outline-none border border-neutral-300 rounded-md shadow-sm px-1"
              value={choiceBForm}
              onInput={(e) => setChoiceBForm(e.currentTarget.value)}
            />
          </div>
          <button
            class="rounded-md shadow-md bg-green-300 p-1 mt-4 font-bold text-sm text-neutral-600 transition-all hover:scale-[1.03]"
            onClick={addTopic}
          >
            추가하기
          </button>
        </form>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app"));
