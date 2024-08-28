import { batch, useSignal, useSignalEffect } from "@preact/signals";
import { render } from "preact";
import { useEffect } from "preact/hooks";
import "./style.css";
import { Topic } from "./model";
import { TopicEntry } from "./TopicEntry";
import { TopicForm } from "./TopicForm";

const BASE_URL = import.meta.env.BASE_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const topics = useSignal<Topic[]>([]);
  const currentIndex = useSignal(0);
  const isTopicsFetched = useSignal(false);

  useEffect(() => {
    fetchTopicList();
  }, []);

  const fetchTopicList = async () => {
    const url = `${API_BASE_URL}/topic`;
    const res = await fetch(url);
    const _topics: Topic[] = (await res.json())
      .sort((a: Topic, b: Topic) => {
        const av = a.Votes.reduce((s, x) => s + x, 0);
        const bv = b.Votes.reduce((s, x) => s + x, 0);
        return av === bv ? a.Id - b.Id : av - bv;
      })
      .reverse();

    const routeTopicId = location.pathname.slice(BASE_URL.length);
    const index = _topics.findIndex((t) => t.Id === +routeTopicId);

    batch(() => {
      topics.value = _topics;
      if (index >= 0) {
        currentIndex.value = index;
      }
    });
    isTopicsFetched.value = true;
  };

  useSignalEffect(() => {
    if (isTopicsFetched.value) changeRoute();
  });

  const changeRoute = () => {
    const topic = topics.value[currentIndex.value];
    if (topic) {
      window.history.replaceState({}, "", `${BASE_URL}${topic.Id}`);
      document.title = topic.Content;
    } else {
      window.history.replaceState({}, "", `${BASE_URL}`);
      document.title = "LDL";
    }
  };

  const deleteTopic = async (topicId: number) => {
    const url = `${API_BASE_URL}/topic/${topicId}`;
    try {
      await fetch(url, { method: "DELETE" });
      batch(() => {
        topics.value = topics.value.filter((t) => t.Id !== topicId);
        currentIndex.value = Math.min(currentIndex.value, topics.value.length - 1);
      });
    } catch (e) {
      console.log("delete error", e);
    }
  };

  const onTopicAdded = (topic: Topic) => {
    batch(() => {
      topics.value = [...topics.value, topic];
      currentIndex.value = topics.value.length - 1;
    });
  };

  return (
    <div class="flex flex-col w-full h-full justify-center items-center gap-16 p-2">
      {topics.value.length > 0 && (
        <div class="w-full flex flex-row justify-center items-center gap-4">
          <button
            class="shadow-md bg-neutral-300 text-white rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition-all shrink-0"
            onClick={() => (currentIndex.value = (currentIndex.value - 1 + topics.value.length) % topics.value.length)}
          >
            ◀
          </button>
          {topics.value
            .map((topic, i) => (
              <div class="shadow-md bg-white rounded-2xl p-4 w-full min-w-[12rem] max-w-[33rem] relative overflow-hidden">
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
            class="shadow-md bg-neutral-300 text-white rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition-all shrink-0"
            onClick={() => (currentIndex.value = (currentIndex.value + 1) % topics.value.length)}
          >
            ▶
          </button>
        </div>
      )}
      <div class="w-full min-w-[18rem] max-w-[39rem] px-12">
        <div class="shadow-md bg-white rounded-2xl p-4">
          <TopicForm onTopicAdded={onTopicAdded} />
        </div>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app"));
