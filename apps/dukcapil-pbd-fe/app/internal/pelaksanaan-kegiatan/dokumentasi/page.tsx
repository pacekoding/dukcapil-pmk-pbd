import Link from "next/link";
import { ActivityFiles } from "@/components/activity/activity-files";
export default function Page() {
  return (
    <main className="space-y-5">
      <Link
        href="/internal/pelaksanaan-kegiatan"
        className="text-pbd-blue underline"
      >
        Pusat Pelaksanaan Kegiatan
      </Link>
      <ActivityFiles kind="photo" />
    </main>
  );
}
