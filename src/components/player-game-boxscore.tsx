import type { StatLine } from "@/lib/team-data";

const BOX_COLUMNS = [
  { key: "player", label: "PLAYER" },
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "fgm-a", label: "FGM-A" },
  { key: "fg%", label: "FG%" },
  { key: "3pm-a", label: "3PM-A" },
  { key: "3p%", label: "3P%" },
  { key: "ftm-a", label: "FTM-A" },
  { key: "ft%", label: "FT%" },
  { key: "reb", label: "REB" },
  { key: "oreb", label: "OREB" },
  { key: "dreb", label: "DREB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "to", label: "TO" },
  { key: "pf", label: "PF" },
  { key: "pm", label: "+/-" },
] as const;

const HIGHLIGHT_COLUMNS = new Set(["pts", "reb", "ast"]);
const BOX_GRID_COLUMNS =
  "minmax(90px, 1.5fr) minmax(48px, 0.7fr) minmax(40px, 0.55fr) repeat(3, minmax(58px, 0.85fr) minmax(46px, 0.65fr)) repeat(9, minmax(38px, 0.55fr))";

type BoxColumnKey = (typeof BOX_COLUMNS)[number]["key"];

type PlayerGameBoxscoreProps = {
  playerName: string;
  box: StatLine;
};

function formatPercentage(made: number, attempted: number) {
  if (!attempted) {
    return "0.0";
  }

  if (made === attempted) {
    return "100";
  }

  return (Math.round((made / attempted) * 1000) / 10).toFixed(1);
}

function formatSignedNumber(value?: number) {
  if (value === undefined) {
    return "-";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function getBoxValue(playerName: string, box: StatLine, key: BoxColumnKey) {
  switch (key) {
    case "player":
      return playerName;
    case "min":
      return box.min;
    case "pts":
      return box.pts;
    case "fgm-a":
      return `${box.fgm}-${box.fga}`;
    case "fg%":
      return formatPercentage(box.fgm, box.fga);
    case "3pm-a":
      return `${box.tpm}-${box.tpa}`;
    case "3p%":
      return formatPercentage(box.tpm, box.tpa);
    case "ftm-a":
      return `${box.ftm}-${box.fta}`;
    case "ft%":
      return formatPercentage(box.ftm, box.fta);
    case "reb":
      return box.reb;
    case "oreb":
      return box.oreb;
    case "dreb":
      return box.dreb;
    case "ast":
      return box.ast;
    case "stl":
      return box.stl;
    case "blk":
      return box.blk;
    case "to":
      return box.to;
    case "pf":
      return box.pf;
    case "pm":
      return formatSignedNumber(box.pm);
    default:
      return "";
  }
}

function getCellClassName(key: BoxColumnKey) {
  const classNames = [
    "flex",
    "items-center",
    key === "player" ? "justify-start" : "justify-center",
    "px-2",
    "py-2",
  ];

  if (key === "player") {
    classNames.push(
      "sticky",
      "left-0",
      "z-10",
      "overflow-hidden",
      "text-ellipsis",
      "whitespace-nowrap",
      "font-medium",
    );
  }

  if (HIGHLIGHT_COLUMNS.has(key)) {
    classNames.push("bg-selected", "font-semibold", "text-heading");
  }

  return classNames.join(" ");
}

export function PlayerGameBoxscore({
  playerName,
  box,
}: PlayerGameBoxscoreProps) {
  return (
    <div
      className="mt-4 overflow-x-auto text-xs text-muted"
      role="table"
      aria-label="Player box score"
    >
      <div
        className="min-w-[832px] w-full border-b-2 border-divider bg-card font-semibold text-heading"
        role="row"
        style={{ display: "grid", gridTemplateColumns: BOX_GRID_COLUMNS }}
      >
        {BOX_COLUMNS.map((column) => (
          <div
            key={column.key}
            className={`${getCellClassName(column.key)} ${
              column.key === "player" ? "bg-card" : ""
            }`}
            role="columnheader"
          >
            {column.label}
          </div>
        ))}
      </div>
      <div
        className="min-w-[832px] w-full bg-card-alt text-copy transition-colors hover:bg-hover"
        role="row"
        style={{ display: "grid", gridTemplateColumns: BOX_GRID_COLUMNS }}
      >
        {BOX_COLUMNS.map((column) => (
          <div
            key={column.key}
            className={`${getCellClassName(column.key)} ${
              column.key === "player" ? "bg-card-alt" : ""
            }`}
            role="cell"
          >
            {getBoxValue(playerName, box, column.key)}
          </div>
        ))}
      </div>
    </div>
  );
}
