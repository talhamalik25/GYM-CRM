import Image from "next/image";

export default function FitivoLogo({ width = 120, height = 40, priority = false, className = "", inverse = false }) {
  return (
    <span className={`inline-flex shrink-0 items-center ${inverse ? "rounded-md bg-white px-1" : ""} ${className}`}>
      <Image
        src="/logo.png"
        alt="Fitivo"
        width={width}
        height={height}
        priority={priority}
        className="h-auto max-w-full object-contain"
      />
    </span>
  );
}
