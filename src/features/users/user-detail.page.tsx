import { useParams } from "react-router-dom";

import { UserDetail } from "./ui/user-detail";

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <div className="w-full h-full">
      <UserDetail userId={id} />
    </div>
  );
};

export const Component = UserDetailPage;
