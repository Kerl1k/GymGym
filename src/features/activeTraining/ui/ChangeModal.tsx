import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { FC } from "react";

type ChangeModalProps = {
  close: () => void;
  isOpen: boolean;
  currentExercise: any;
};

export const ChangeModal: FC<ChangeModalProps> = ({ close, isOpen }) => {
  return (
    <Modal close={close} isOpen={isOpen}>
      <div></div>
    </Modal>
  );
};
