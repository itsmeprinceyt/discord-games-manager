import Loader from "./Loader";
import PageWrapper from "./PageWrapper";

export default function LoaderFullscreen({ text }: { text?: string }) {
  return (
    <PageWrapper>
      <div className=" min-h-screen p-4 md:p-6 flex items-center justify-center">
        {text ? <Loader text={text} /> : <Loader />}
      </div>
    </PageWrapper>
  );
}
