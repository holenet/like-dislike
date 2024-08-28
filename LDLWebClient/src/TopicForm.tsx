import { useState } from "preact/hooks";
import { Topic } from "./model";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Props = {
  onTopicAdded?: (topic: Topic) => any;
};
export function TopicForm({ onTopicAdded }: Props) {
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
    setContentForm("");
    setChoiceAForm("");
    setChoiceBForm("");

    const topic = await res.json();
    onTopicAdded?.(topic);
  };

  return (
    <form class="w-full flex flex-col gap-1">
      <div class="flex gap-1 ">
        <div class="w-20 text-right text-neutral-600">토픽:</div>
        <input
          class="outline-none border border-neutral-300 rounded-md shadow-sm px-1 grow shrink min-w-0"
          value={contentForm}
          onInput={(e) => setContentForm(e.currentTarget.value)}
        />
      </div>
      <div class="flex gap-1">
        <div class="w-20 text-right text-neutral-600">선택지A:</div>
        <input
          class="outline-none border border-neutral-300 rounded-md shadow-sm px-1 grow shrink min-w-0"
          value={choiceAForm}
          onInput={(e) => setChoiceAForm(e.currentTarget.value)}
        />
      </div>
      <div class="flex gap-1">
        <div class="w-20 text-right text-neutral-600">선택지B:</div>
        <input
          class="outline-none border border-neutral-300 rounded-md shadow-sm px-1 grow shrink min-w-0"
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
  );
}
