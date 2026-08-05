import Image from "next/image";

import { cn } from "@/lib/utils";
import type { PegawaiArchive } from "@/types/arsipku";

type EmployeePhotoProps = {
  employee: Pick<
    PegawaiArchive,
    "name" | "photoColor" | "photoPreviewUrl"
  >;
  className?: string;
  imageClassName?: string;
  sizes?: string;
};

export function EmployeePhoto({
  employee,
  className,
  imageClassName,
  sizes = "220px",
}: EmployeePhotoProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden font-extrabold ring-1 ring-current/10",
        employee.photoColor,
        className,
      )}
    >
      {employee.photoPreviewUrl ? (
        <Image
          src={employee.photoPreviewUrl}
          alt={`Foto ${employee.name}`}
          fill
          unoptimized
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        getInitials(employee.name)
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
