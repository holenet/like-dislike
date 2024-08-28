import classNames from "classnames";
import { useTransitionInteger } from "./hooks";
import { numberWithCommas } from "./utils";

type Props = {
  choice: string;
  voteCount: number;
  totalVoteCount: number;
  voteRecord: number;
  bgColor: string;
  color: string;
  onChoiceClicked: () => any;
};
export function ChoiceEntry({
  choice,
  voteCount,
  totalVoteCount,
  voteRecord,
  bgColor,
  color,
  onChoiceClicked,
}: Props) {
  const votePermil =
    totalVoteCount === 0 ? 0 : ~~((voteCount / totalVoteCount) * 1000);
  const voteCount_T = useTransitionInteger(voteCount);
  const votePermil_T = useTransitionInteger(votePermil);
  const voteRecord_T = useTransitionInteger(voteRecord);
  const votePercent_T = votePermil_T / 10;

  return (
    <button
      className={classNames(
        "rounded-xl shadow-sm px-4 py-2 hover:scale-[1.03] transition-all flex flex-col items-stretch gap-1 relative overflow-hidden",
        bgColor
      )}
      onClick={onChoiceClicked}
    >
      <div
        className={classNames(
          "absolute top-0 left-0 h-full w-full z-10",
          color
        )}
        style={{
          transition: "background-color 150ms",
          transform: `translateX(${-100 + votePermil_T / 10}%)`,
          filter: "saturate(75%) brightness(120%)",
        }}
      ></div>
      <div class="h-full w-full z-20" style="text-shadow: 0 0 2px #00000042">
        <div class="font-bold text-white text-start break-words">{choice}</div>
        <div class="flex flex-row items-baseline flex-wrap justify-between">
          <div class="font-bold text-white">
            {numberWithCommas(voteCount_T)}
            <span class="text-xs ml-0.5">Votes</span>
          </div>
          <div className={"font-bold text-white"}>
            {votePercent_T.toFixed(1)}%
          </div>
        </div>
        <div
          className={classNames(
            "text-white text-xs font-bold text-start pb-1",
            {
              "opacity-0": voteRecord === 0,
              "opacity-85": voteRecord > 0,
            }
          )}
        >
          +{numberWithCommas(voteRecord_T)} by you
        </div>
      </div>
    </button>
  );
}
