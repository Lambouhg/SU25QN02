import mongoose, { Schema, Document } from 'mongoose';

export interface IPosition extends Document {
  key: string; // Định danh duy nhất cho vị trí hoặc cấp độ (ví dụ: backend_developer, frontend_developer)
  value: string; // Giá trị hiển thị hoặc mô tả (ví dụ: Backend Developer, Frontend Developer)
  type: string; // Loại dữ liệu hoặc cấp độ (có thể là Junior, Mid, Senior, hoặc ngành nghề cụ thể)
  order: number; // Thứ tự sắp xếp
}

const PositionSchema = new Schema<IPosition>({
  key: { type: String, required: true, unique: true }, // Giá trị chính
  value: { type: String, required: true }, // Giá trị hiển thị hoặc mô tả
  type: { type: String, required: true }, // Loại dữ liệu hoặc cấp độ
  order: { type: Number, default: 0 } // Thứ tự sắp xếp
});

const Position = mongoose.models.Position || mongoose.model<IPosition>('Position', PositionSchema);
export default Position;
