import { Button } from "@/components/ui/button";
import { HistoryRecord } from "@/lib/routeTypes";

type HistoryListProps = {
  records: HistoryRecord[];
  onReload: (record: HistoryRecord) => void;
};

const HistoryList = ({ records, onReload }: HistoryListProps) => (
  <div className="space-y-4">
    {records.map((record) => (
      <div key={record.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{record.name}</p>
            <p className="text-sm text-muted-foreground">{new Date(record.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onReload(record)}>Reload route</Button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default HistoryList;
