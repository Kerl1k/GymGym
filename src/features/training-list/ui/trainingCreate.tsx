import { Button } from "@/shared/ui/kit/button";
import { DropdownInput } from "@/shared/ui/kit/dropdownInput/dropdown-input";
import { Input } from "@/shared/ui/kit/input";
import { FC, useState } from "react";

import styles from "./exercisesCreate.module.scss";
import { useCreateTraining } from "../model/use-create-board";
import { ApiSchemas } from "@/shared/api/schema";
import { useExercisesList } from "../model/use-boards-list";

type TrainingCreateProps = {
  close: () => void;
};

export const TrainingCreate: FC<TrainingCreateProps> = ({ close }) => {
  const { exercises: exercosesList } = useExercisesList({});
  const [form, setForm] = useState<ApiSchemas["Training"]>({
    id: "0",
    name: "",
    type: "balance",
    exercises: [
      {
        id: "",
        name: "",
        type: "balance",
        chill: "",
        weight: 15,
        count: 8,
        approaches: 1,
      },
    ],
  });

  const exercisesItem = exercosesList.map((exercise) => exercise.name);

  const { create, isPending } = useCreateTraining();

  const items: ApiSchemas["Training"]["type"][] = [
    "cardio",
    "strength",
    "flexibility",
    "balance",
    "yoga",
    "pilates",
  ];

  // Добавляем индекс упражнения в обработчики onChange
  const addExercises =
    (index: number) =>
    ({ id, value }: { id: string; value: string }) => {
      console.log(id, value, index);

      if (id === "name" || id === "type") {
        setForm({
          ...form,
          [id]: value,
        });
      } else {
        // Обновляем конкретное упражнение по индексу
        setForm((prevForm) => ({
          ...prevForm,
          exercises: prevForm.exercises.map((exercise, i) =>
            i === index ? { ...exercise, [id]: value } : exercise,
          ),
        }));
      }
    };

  const addNewExercises = () => {
    setForm({
      ...form,
      exercises: [
        ...form.exercises,
        {
          id: "",
          name: "",
          type: "balance",
          chill: "",
          weight: 15,
          count: 8,
          approaches: 1,
        },
      ],
    });
  };

  const createTraining = () => {
    if (!isPending) {
      create({
        name: form.name,
        type: form.type as ApiSchemas["Training"]["type"],
        exercises: [...form.exercises],
      });
      close();
    }
  };

  return (
    <div className={styles.container}>
      <Input
        id="name"
        placeholder="Введите название тренировки..."
        value={form.name}
        onChange={addExercises(0)} // Для полей формы используем индекс 0
        className="w-full"
      />
      <DropdownInput
        id="type"
        items={items}
        onChange={addExercises(0)} // Для полей формы используем индекс 0
        value={form.type}
        className=" w-full"
      />
      {form.exercises.map((exercise, index) => (
        <div key={index}>
          Упражнение № {index + 1}
          <DropdownInput
            id="exercises"
            items={exercisesItem}
            onChange={addExercises(index)} // Передаем индекс текущего упражнения
            value={exercise.name}
            className=" w-full"
          />
          <Input
            id="weight"
            placeholder="вес"
            value={exercise.weight}
            onChange={addExercises(index)} // Передаем индекс текущего упражнения
            className="w-wull"
          />
          <Input
            id="count"
            placeholder="кол-во повтоений"
            value={exercise.count}
            onChange={addExercises(index)} // Передаем индекс текущего упражнения
            className="w-wull"
          />
          <Input
            id="approaches"
            placeholder="кол-во подходов"
            value={exercise.approaches}
            onChange={addExercises(index)} // Передаем индекс текущего упражнения
            className="w-wull"
          />
          <Input
            id="chill"
            placeholder="Отдых между упражнениями"
            value={exercise.chill}
            onChange={addExercises(index)} // Передаем индекс текущего упражнения
            className="w-wull"
          />
        </div>
      ))}
      <Button onClick={addNewExercises}>Добавить упражнение</Button>
      <div className={styles.button}>
        <Button onClick={createTraining}>Создать тренировку</Button>
      </div>
    </div>
  );
};
