import { useMemo, useState, type ReactNode } from "react";

import { ActivityCharts } from "./activity-charts";
import {
  filterHistoryByRange,
  getRangeEndDate,
  getRangeFromScale,
  getRangeSpanDays,
  getWeeksForRange,
  type ScaleKey,
} from "./lib/period";
import {
  computeDayOfWeekDistribution,
  computeMuscleDistribution,
  computeOverviewStats,
  computePersonalRecords,
  computeTopPrograms,
  computeWeeklyActivity,
  type TrainingHistoryItem,
} from "./lib/stats";
import { MuscleGroups } from "./muscle-groups";
import { OverviewStats } from "./overview-stats";
import { PeriodFilter } from "./period-filter";
import { PersonalRecords } from "./personal-records";
import { ProfileHeader } from "./profile-header";
import { TopPrograms } from "./top-programs";
import { TrainingHistoryList } from "./training-history-list";
import styles from "./user-profile.module.scss";

const HISTORY_LIST_LIMIT = 10;

export type UserProfileViewProps = {
  email: string;
  /** Full history used for stats / charts / records */
  history: TrainingHistoryItem[];
  /** Optional shorter list for the history section; defaults to `history` */
  recentHistory?: TrainingHistoryItem[];
  headerActions?: ReactNode;
  showViewAllHistory?: boolean;
  onDeleteTraining?: (id: string) => void;
  isDeletePending?: (id: string) => boolean;
};

export function UserProfileView({
  email,
  history,
  recentHistory,
  headerActions,
  showViewAllHistory = false,
  onDeleteTraining,
  isDeletePending,
}: UserProfileViewProps) {
  const [scale, setScale] = useState<ScaleKey>("all");

  const range = useMemo(() => getRangeFromScale(scale), [scale]);

  const filteredHistory = useMemo(
    () => filterHistoryByRange(history, range),
    [history, range],
  );

  const spanDays = useMemo(() => getRangeSpanDays(range), [range]);
  const weeks = useMemo(() => getWeeksForRange(range), [range]);
  const rangeEnd = useMemo(() => getRangeEndDate(range), [range]);
  const isUnfiltered = scale === "all";

  const overview = useMemo(
    () =>
      computeOverviewStats(filteredHistory, {
        spanDays: isUnfiltered ? null : spanDays,
      }),
    [filteredHistory, isUnfiltered, spanDays],
  );

  const weeklyActivity = useMemo(
    () => computeWeeklyActivity(filteredHistory, weeks, rangeEnd),
    [filteredHistory, weeks, rangeEnd],
  );

  const dayOfWeek = useMemo(
    () => computeDayOfWeekDistribution(filteredHistory),
    [filteredHistory],
  );

  const muscles = useMemo(
    () => computeMuscleDistribution(filteredHistory),
    [filteredHistory],
  );

  const topPrograms = useMemo(
    () => computeTopPrograms(filteredHistory),
    [filteredHistory],
  );

  const personalRecords = useMemo(
    () => computePersonalRecords(filteredHistory),
    [filteredHistory],
  );

  const historyList = useMemo(() => {
    if (isUnfiltered) {
      return recentHistory ?? history;
    }
    return filteredHistory.slice(0, HISTORY_LIST_LIMIT);
  }, [isUnfiltered, recentHistory, history, filteredHistory]);

  return (
    <div className={styles.page}>
      <ProfileHeader email={email} actions={headerActions} />

      <PeriodFilter scale={scale} onScaleChange={setScale} />

      <OverviewStats
        trainingsCount={overview.trainingsCount}
        perWeek={overview.perWeek}
        uniqueDays={overview.uniqueDays}
        perWeekSpanDays={overview.perWeekSpanDays}
      />

      <ActivityCharts
        weeklyActivity={weeklyActivity}
        dayOfWeek={dayOfWeek}
      />

      <div className={styles.contentGrid}>
        <div className={styles.leftColumn}>
          <TrainingHistoryList
            history={historyList}
            showViewAll={showViewAllHistory}
            onDelete={onDeleteTraining}
            isDeletePending={isDeletePending}
          />
          <PersonalRecords records={personalRecords} />
        </div>

        <div className={styles.rightColumn}>
          <MuscleGroups muscles={muscles} />
          <TopPrograms programs={topPrograms} />
        </div>
      </div>
    </div>
  );
}
