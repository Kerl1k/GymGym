import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";

const ExercisesToggle = () => {
  const [tabs, setTabs] = useState("global");

  return (
    <>
      <Tabs defaultValue={tabs} onValueChange={(e) => setTabs(e)}>
        <TabsList>
          <TabsTrigger value="my">my</TabsTrigger>
          <TabsTrigger value="global">global</TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
};

export default ExercisesToggle;
