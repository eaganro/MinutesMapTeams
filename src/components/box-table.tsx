import Link from "next/link";
import type { ReactNode } from "react";
import { formatPercentage, formatSigned } from "@/lib/format";
import type { StatLine } from "@/lib/team-data";

type BoxRow = {
  key: string | number;
  name: ReactNode;
  href?: string;
  box: StatLine;
};

const HIGHLIGHT = "box-hl";

function BoxCells({ box }: { box: Partial<StatLine> }) {
  const n = (value: number | undefined) => value ?? 0;

  return (
    <>
      <td>{box.min ?? "–"}</td>
      <td className={HIGHLIGHT}>{n(box.pts)}</td>
      <td>
        {n(box.fgm)}-{n(box.fga)}
      </td>
      <td>{formatPercentage(n(box.fgm), n(box.fga))}</td>
      <td>
        {n(box.tpm)}-{n(box.tpa)}
      </td>
      <td>{formatPercentage(n(box.tpm), n(box.tpa))}</td>
      <td>
        {n(box.ftm)}-{n(box.fta)}
      </td>
      <td>{formatPercentage(n(box.ftm), n(box.fta))}</td>
      <td className={HIGHLIGHT}>{n(box.reb)}</td>
      <td>{n(box.oreb)}</td>
      <td>{n(box.dreb)}</td>
      <td className={HIGHLIGHT}>{n(box.ast)}</td>
      <td>{n(box.stl)}</td>
      <td>{n(box.blk)}</td>
      <td>{n(box.to)}</td>
      <td>{n(box.pf)}</td>
      <td>{box.pm === undefined ? "" : formatSigned(box.pm)}</td>
    </>
  );
}

// A game box score in the main MinutesMap layout: PTS, REB and AST tinted.
export function BoxTable({
  rows,
  total,
  firstColumnLabel = "Player",
  ariaLabel,
}: {
  rows: BoxRow[];
  total?: Partial<StatLine>;
  firstColumnLabel?: string;
  ariaLabel: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="box-table" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">{firstColumnLabel}</th>
            <th scope="col">MIN</th>
            <th scope="col" className={HIGHLIGHT}>
              PTS
            </th>
            <th scope="col">FGM-A</th>
            <th scope="col">FG%</th>
            <th scope="col">3PM-A</th>
            <th scope="col">3P%</th>
            <th scope="col">FTM-A</th>
            <th scope="col">FT%</th>
            <th scope="col" className={HIGHLIGHT}>
              REB
            </th>
            <th scope="col">OREB</th>
            <th scope="col">DREB</th>
            <th scope="col" className={HIGHLIGHT}>
              AST
            </th>
            <th scope="col">STL</th>
            <th scope="col">BLK</th>
            <th scope="col">TO</th>
            <th scope="col">PF</th>
            <th scope="col">+/-</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                {row.href ? (
                  <Link href={row.href} className="hover:underline">
                    {row.name}
                  </Link>
                ) : (
                  row.name
                )}
              </td>
              <BoxCells box={row.box} />
            </tr>
          ))}
        </tbody>
        {total ? (
          <tfoot>
            <tr>
              <td>Team</td>
              <BoxCells box={total} />
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
