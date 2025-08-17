"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Search } from "lucide-react";

interface Interview {
  id: string;
  userId: string;
  jobRoleId: string;
  jobRole: {
    title: string;
    level: string;
    displayName: string;
  };
  language: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: string;
  progress: number;
  questionCount: number;
  coveredTopics: string[];
  conversationHistory?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  evaluation?: {
    overallRating: number;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    recommendations?: string[];
  };
  skillAssessment?: Record<string, number>;
}

// Dialog UI: dùng tạm <div> thay cho Dialog/ScrollArea nếu chưa có
interface InterviewDetailDialogProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
}

function InterviewDetailDialog({ interview, isOpen, onClose }: InterviewDetailDialogProps) {
  if (!interview || !isOpen) return null;

  // Mapping dữ liệu
  const candidateName = interview.userId || "Ứng viên";
  const interviewer = ""; // Nếu có trường interviewer thì lấy, không thì để trống
  const position = interview.jobRole.displayName;
  const date = new Date(interview.startTime).toLocaleString();
  const status = interview.status;
  const summary = interview.evaluation?.recommendations?.join(', ') || "";
  const notes = ""; // Nếu có trường notes thì lấy, không thì để trống
  const conversationHistory = interview.conversationHistory?.map(msg => ({
    speaker: msg.role === 'user' ? 'Bạn' : 'AI',
    text: msg.content
  })) || [];
  const skillScores = interview.skillAssessment || {};

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Hoàn thành":
      case "completed":
        return "default";
      case "Đang chờ":
      case "pending":
        return "secondary";
      case "Đã hủy":
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleOverlayClick}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-[700px] w-full max-h-[90vh] flex flex-col relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 z-10">Đóng</button>
        <div className="p-6 border-b">
          <div className="text-xl font-bold">Chi tiết phiên phỏng vấn</div>
          <div className="text-muted-foreground text-sm">Thông tin chi tiết về phiên phỏng vấn này.</div>
        </div>
        <div className="overflow-y-auto flex-grow grid gap-4 py-4 pr-4">
          <div className="grid grid-cols-4 items-center gap-4 px-6">
            <span className="text-sm font-medium col-span-1">Ứng viên:</span>
            <span className="col-span-3">{candidateName}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4 px-6">
            <span className="text-sm font-medium col-span-1">Người phỏng vấn:</span>
            <span className="col-span-3">{interviewer}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4 px-6">
            <span className="text-sm font-medium col-span-1">Vị trí:</span>
            <span className="col-span-3">{position}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4 px-6">
            <span className="text-sm font-medium col-span-1">Ngày:</span>
            <span className="col-span-3">{date}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4 px-6">
            <span className="text-sm font-medium col-span-1">Trạng thái:</span>
            <Badge variant={getStatusVariant(status)} className="col-span-3 w-fit">{status}</Badge>
          </div>
          <div className="grid grid-cols-4 items-start gap-4 px-6">
            <span className="text-sm font-medium col-span-1">Tóm tắt:</span>
            <p className="col-span-3 text-sm text-muted-foreground">{summary}</p>
          </div>
          <div className="grid grid-cols-4 items-start gap-4 px-6">
            <span className="text-sm font-medium col-span-1">Ghi chú:</span>
            <p className="col-span-3 text-sm text-muted-foreground">{notes}</p>
          </div>
          {conversationHistory.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold mb-2 px-6">Lịch sử hội thoại</h3>
              <div className="space-y-3 max-h-[200px] overflow-y-auto border rounded-md p-3 bg-gray-50 mx-6">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{msg.speaker}:</span> {msg.text}
                  </div>
                ))}
              </div>
            </>
          )}
          {skillScores && Object.keys(skillScores).length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold mb-2 px-6">Đánh giá kỹ năng</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-6">
                {Object.entries(skillScores).map(([skill, score]) => (
                  <div key={skill} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                    <span className="font-medium">{skill}:</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary-foreground">{score}/10</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewHistoryPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const confirmRef = useRef<HTMLDialogElement>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const pageSize = 10;

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/interviews');
      const data = await res.json();
      setInterviews(data.interviews || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInterviews(); }, []);

  const handleViewDetail = (id: string) => {
    const interview = interviews.find(i => i.id === id);
    setSelectedInterview(interview || null);
    setShowDetailDialog(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    confirmRef.current?.showModal();
  };
  const confirmDelete = async () => {
    if (deleteId) {
      setIsDeleting(true);
      confirmRef.current?.close(); // Đóng modal NGAY LẬP TỨC
      setDeleteId(null);
      const start = Date.now();
      await fetch(`/api/interviews/${deleteId}`, { method: 'DELETE' });
      setInterviews(prev => prev.filter(i => i.id !== deleteId));
      // Đảm bảo loading tối thiểu 800ms
      const elapsed = Date.now() - start;
      const minDelay = 800;
      if (elapsed < minDelay) {
        await new Promise(res => setTimeout(res, minDelay - elapsed));
      }
      setIsDeleting(false);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 2000);
    }
  };
  const cancelDelete = () => {
    setDeleteId(null);
    confirmRef.current?.close();
  };

  const filteredInterviews = useMemo(() => {
    if (!searchTerm) return interviews;
    const lower = searchTerm.toLowerCase();
    return interviews.filter(i =>
              i.jobRole.displayName.toLowerCase().includes(lower) ||
        i.jobRole.title.toLowerCase().includes(lower)
    );
  }, [searchTerm, interviews]);

  const paginatedInterviews = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInterviews.slice(start, start + pageSize);
  }, [filteredInterviews, page]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Hoàn thành":
      case "completed":
        return "default";
      case "Đang chờ":
      case "pending":
        return "secondary";
      case "Đã hủy":
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full px-0"> {/* Bỏ max-w-3xl mx-auto */}
        {/* Loading overlay khi xóa */}
        {isDeleting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg px-8 py-6 flex flex-col items-center shadow-lg">
              <svg className="animate-spin mb-2" width="40" height="40" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="#3B82F6" strokeWidth="4" opacity="0.2" />
                <path d="M44 24c0-11.046-8.954-20-20-20" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <span className="text-blue-600 font-medium">Đang xóa...</span>
            </div>
          </div>
        )}
        {/* Toast báo xóa thành công */}
        {deleteSuccess && (
          <div className="fixed top-6 right-6 z-[100] bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Xóa thành công!</span>
          </div>
        )}
        <Card className="w-full"> {/* Bỏ max-w-3xl mx-auto */}
          <CardHeader className="sticky top-0 bg-white z-10 pb-2"> {/* Sticky search bar */}
            <CardTitle className="text-2xl font-bold">Lịch sử phiên phỏng vấn</CardTitle>
            <CardDescription>Quản lý và xem chi tiết các phiên phỏng vấn đã diễn ra.</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo vị trí..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 rounded-md border focus:ring-2 focus:ring-primary focus:border-primary"
                aria-label="Tìm kiếm phiên phỏng vấn"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-40"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span></div>
              ) : paginatedInterviews.length === 0 ? (
                <p className="text-center text-muted-foreground">Không tìm thấy phiên phỏng vấn nào.</p>
      ) : (
                paginatedInterviews.map(i => (
                  <Card
                    key={i.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="grid gap-1 flex-grow">
                      <h3 className="font-semibold text-lg">{i.jobRole.displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                                                  Vị trí: {i.jobRole.title} &middot; Ngày: {new Date(i.startTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">Số câu hỏi: {i.questionCount} &middot; Điểm tổng: <span className="font-bold text-yellow-600">{i.evaluation?.overallRating ?? 'N/A'}</span></p>
                </div>
                    <div className="flex items-center gap-3 mt-3 md:mt-0 md:ml-4">
                      <Badge variant={getStatusVariant(i.status)}>{i.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleViewDetail(i.id)}>
                        Xem chi tiết
                      </Button>
                      {i.evaluation && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => window.location.href = `/avatar-interview/evaluation?id=${i.id}`}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Xem đánh giá
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(i.id)}>
                        Xóa
                      </Button>
                  </div>
                  </Card>
                ))
              )}
                </div>
            {/* Nút Xem thêm nếu còn dữ liệu */}
            {filteredInterviews.length > page * pageSize && (
              <div className="flex justify-center mt-4">
                <Button onClick={() => setPage(page + 1)} variant="outline">Xem thêm</Button>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Modal xác nhận xóa và modal chi tiết giữ nguyên */}
        <InterviewDetailDialog
          interview={selectedInterview}
          isOpen={!!selectedInterview && showDetailDialog}
          onClose={() => { setShowDetailDialog(false); setSelectedInterview(null); }}
        />
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl bg-white p-0 w-80 max-w-full shadow-2xl">
        <div className="p-6">
                <div className="font-bold text-lg mb-2 text-red-600 flex items-center gap-2">
                  <HighlightOffIcon className="!w-6 !h-6" /> Xác nhận xóa
                </div>
          <div className="mb-4 text-gray-700">Bạn có chắc chắn muốn xóa phiên phỏng vấn này?</div>
          <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelDelete}>Hủy</Button>
                  <Button variant="destructive" onClick={confirmDelete}>Xóa</Button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
} 