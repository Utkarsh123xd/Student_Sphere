import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import EventTimeline from "@/components/EventTimeline"; 

export default function EventPage() {
  return (
    <div className="App">
      <Sidebar />
      <EventTimeline />
      <ScrollToTop />
    </div>
  );
}
