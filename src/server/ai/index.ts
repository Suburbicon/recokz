import { detectBank } from "./queries/detect-bank";
import { detectTableStartRow } from "./queries/detect-table-start-row";
import { detectTableColumns } from "./queries/detect-table-columns";
import { reconcileDocs } from './queries/reconcile';

export const ai = {
  detectBank,
  detectTableStartRow,
  detectTableColumns,
  reconcileDocs
};
