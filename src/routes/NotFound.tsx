import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';

export function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-5xl">🤔</p>
        <h1 className="text-xl font-semibold">ไม่พบหน้านี้</h1>
        <Link to="/" className="btn-primary">
          กลับหน้าแรก
        </Link>
      </div>
    </Layout>
  );
}
