import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtom";
import { Navigate, useParams } from "react-router-dom";

const ProtectedRouter = ({ children }) => {
  const [user] = useAtom(userAtom);
  const params = useParams();

  console.log(user);
  return user.id !== "" && user.roomId !== "" ? (
    children
  ) : (
    <Navigate to={`/?roomId=${params.roomId}`} />
  );
};

export default ProtectedRouter;
