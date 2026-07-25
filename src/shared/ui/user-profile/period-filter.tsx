import { CalendarRange } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";

import { SCALE_OPTIONS, type ScaleKey } from "./lib/period";
import styles from "./user-profile.module.scss";

type PeriodFilterProps = {
  scale: ScaleKey;
  onScaleChange: (scale: ScaleKey) => void;
};

export function PeriodFilter({ scale, onScaleChange }: PeriodFilterProps) {
  return (
    <section className={styles.periodFilter} aria-label="Период статистики">
      <div className={styles.periodFilterHeader}>
        <h2 className={styles.sectionTitle}>
          <CalendarRange size={20} /> Период статистики
        </h2>
        <Select
          value={scale}
          onValueChange={(value) => onScaleChange(value as ScaleKey)}
        >
          <SelectTrigger className={styles.periodSelect}>
            <SelectValue placeholder="Масштаб" />
          </SelectTrigger>
          <SelectContent>
            {SCALE_OPTIONS.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
