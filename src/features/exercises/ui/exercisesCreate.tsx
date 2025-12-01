import { Button } from "@/shared/ui/kit/button";
import { DropdownInput } from "@/shared/ui/kit/dropdownInput/dropdown-input";
import { Input } from "@/shared/ui/kit/input";
import { FC, useState } from "react";

import styles from "./exercisesCreate.module.scss";
import { useCreateBoard } from "../model/use-create-board";

type ExercisesCreateProps = {
  close: () => void;
};

export const ExercisesCreate: FC<ExercisesCreateProps> = ({ close }) => {
  const [form, setForm] = useState({ name: "", type: "" });

  const { create, isPending } = useCreateBoard();

  const items = ["qwe", "ewq", "www"];

  const handleChange = ({ id, value }: { id: string; value: string }) => {
    setForm({
      ...form,
      [id]: value,
    });
  };

  const addExercises = () => {
    if (!isPending) {
      create({ favorite: false, name: form.name, type: form.type });
      close();
    }
  };

  return (
    <div className={styles.container}>
      <Input
        id="name"
        placeholder="Введите название упражнения..."
        value={form.name}
        onChange={handleChange}
        className="w-full"
      />
      <DropdownInput
        id="type"
        items={items}
        onChange={handleChange}
        value={form.type}
        className=" w-full"
      />
      <div className={styles.button}>
        <Button onClick={addExercises}>Создать упражнение</Button>
      </div>
    </div>
  );
};
