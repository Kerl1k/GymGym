import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { useState } from "react";

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
