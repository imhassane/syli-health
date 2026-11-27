import { useState } from "preact/hooks";
import { Button } from "../button/Button.tsx";
import { Modal } from "../modal/Modal.tsx";
import { StoryFrame } from "../StoryFrame.tsx";
import { pharmacyWeek } from "./fixtures.ts";
import { Schedule, type ScheduleEvent } from "./Schedule.tsx";
import { mondayOf } from "./week.ts";

export default { title: "Planning/Schedule", component: Schedule };

// A fixed Wednesday at 10:40, so the stories and their audits never move.
const now = new Date(2026, 10, 25, 10, 40);
const events = pharmacyWeek(mondayOf(now));

function Week() {
  const [open, setOpen] = useState<ScheduleEvent | null>(null);
  return (
    <StoryFrame>
      <Schedule
        label="Planning de la pharmacie"
        events={events}
        now={now}
        onOpen={setOpen}
        actions={
          <Button size="sm" variant="primary" icon="plus">
            Nouveau rendez-vous
          </Button>
        }
      />
      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title ?? ""}
        description={open?.detail}
        footer={<Button variant="primary" onClick={() => setOpen(null)}>Fermer</Button>}
      >
        {open && (
          <p>
            {open.start.toLocaleString("fr", { weekday: "long", hour: "2-digit", minute: "2-digit" })} –{" "}
            {open.end.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </Modal>
    </StoryFrame>
  );
}

export const WeekView = { render: () => <Week /> };

export const EmptyWeek = {
  render: () => (
    <StoryFrame>
      <Schedule label="Planning de la pharmacie" events={[]} now={now} days={5} />
    </StoryFrame>
  ),
};

export const OnAPhone = {
  render: () => (
    <StoryFrame width="24rem">
      <Schedule label="Rendez-vous" events={events} now={now} />
    </StoryFrame>
  ),
};
