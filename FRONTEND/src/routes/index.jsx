import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import HomeTemplate from "../pages/HomeTemplate/index";
import ReviewerTemplate from "../pages/ReviewerTemplate/index";
import Loading from "../components/Loading/Loading";

const routes = [
  {
    path: "/",
    element: HomeTemplate,
    nested: [
      {
        path: "",
        element: lazy(() => import("../pages/HomeTemplate/Home/index")),
      },
      {
        path: "review-text",
        element: lazy(() => import("../pages/HomeTemplate/ReviewText/index")),
      },
      {
        path: "record-speech",
        element: lazy(() => import("../pages/HomeTemplate/RecordSpeech/index")),
      },
      {
        path: "submit-task",
        element: lazy(() => import("../pages/HomeTemplate/SubmitTask/index")),
      },
      {
        path: "contribute",
        element: lazy(
          () => import("../pages/HomeTemplate/ContributeText/index"),
        ),
      },
      {
        path: "recording-history",
        element: lazy(
          () => import("../pages/HomeTemplate/History/RecordingHistory/index"),
        ),
      },
      {
        path: "contribution-history",
        element: lazy(
          () => import("../pages/HomeTemplate/History/ContributionHistory/index"),
        ),
      },
      {
        path: "profile",
        element: lazy(() => import("../pages/HomeTemplate/Profile/index")),
      },
    ],
  },
  {
    path: "/reviewer",
    element: ReviewerTemplate,
    nested: [
      {
        path: "",
        element: lazy(
          () => import("../pages/ReviewerTemplate/ReviewDashboard/index"),
        ),
      },
      {
        path: "task",
        element: lazy(
          () => import("../pages/ReviewerTemplate/ReviewTask/index"),
        ),
      },
      // Kiểm duyệt
      {
        path: "recording",
        element: lazy(
          () => import("../pages/ReviewerTemplate/Review/ReviewRecording/index"),
        ),
      },
      {
        path: "contribution",
        element: lazy(
          () => import("../pages/ReviewerTemplate/Review/ReviewContribution/index"),
        ),
      },
      {
        path: "script",
        element: lazy(
          () => import("../pages/ReviewerTemplate/Review/ReviewScript/index"),
        ),
      },
      // Lịch sử kiểm duyệt
      {
        path: "history-recording",
        element: lazy(
          () => import("../pages/ReviewerTemplate/ReviewHistory/ReviewHistoryRecording/index"),
        ),
      },
      {
        path: "history-contribution",
        element: lazy(
          () => import("../pages/ReviewerTemplate/ReviewHistory/ReviewHistoryContribution/index"),
        ),
      },
      {
        path: "profile",
        element: lazy(() => import("../pages/ReviewerTemplate/Profile/index")),
      },
    ],
  },
  // Bắt mọi URL không tồn tại - phải đặt cuối danh sách
  {
    path: "*",
    element: lazy(() => import("../pages/NotFound/index")),
  },
];

export const renderRoutes = () => {
  return routes.map((route, idx) => {
    const Component = route.element;

    if (route.nested) {
      return (
        <Route key={idx} path={route.path} element={<Component />}>
          {route.nested.map((item) => {
            const NestedComponent = item.element;
            return (
              <Route
                key={item.path}
                path={item.path}
                element={
                  <Suspense fallback={<Loading />}>
                    <NestedComponent {...item.props} />
                  </Suspense>
                }
              />
            );
          })}
        </Route>
      );
    }

    return (
      <Route
        key={idx}
        path={route.path}
        element={
          <Suspense fallback={<Loading className="min-h-screen" />}>
            <Component />
          </Suspense>
        }
      />
    );
  });
};
