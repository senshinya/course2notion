'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { zhCN } from 'date-fns/locale';
import { registerLocale, setDefaultLocale } from "react-datepicker";

registerLocale('zh-CN', zhCN);
setDefaultLocale('zh-CN');

interface Course {
  name: string;
  remark: string;
  weeks: string;
  day: string;
  startTime: string,
  endTime: string,
}

function TimeSelector({ value, onChange }: { value: string, onChange: (time: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-2 border rounded w-full"
    />
  );
}

function CourseModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (course: Course) => void }) {
  const [course, setCourse] = useState<Course>({ name: '', remark: '', weeks: '', day: '0', startTime: '', endTime: ''  });

  const handleChange = (field: keyof Course, value: string | number | Date | null) => {
    setCourse({ ...course, [field]: value });
  };

  const handleSave = () => {
    onSave(course);
    setCourse({ name: '', remark: '', weeks: '', day: '0', startTime: '', endTime: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">添加课程</h2>
        <input 
          type="text" 
          placeholder="课程名称" 
          value={course.name} 
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input 
          type="text" 
          placeholder="上课地点、教师等备注" 
          value={course.remark} 
          onChange={(e) => handleChange('remark', e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <select
          value={course.day} 
          onChange={(e) => handleChange('day', e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="0">周一</option>
          <option value="1">周二</option>
          <option value="2">周三</option>
          <option value="3">周四</option>
          <option value="4">周五</option>
          <option value="5">周六</option>
          <option value="6">周日</option>
        </select>
        
        <div className="mb-2">
          <div className="flex items-center justify-center">
            <div className="flex-grow">
              <TimeSelector
                value={course.startTime}
                onChange={(time) => handleChange('startTime', time)}
              />
            </div>
            <span className="mx-2 flex-shrink-0">~</span>
            <div className="flex-grow">
              <TimeSelector
                value={course.endTime}
                onChange={(time) => handleChange('endTime', time)}
              />
            </div>
          </div>
        </div>
        
        <input 
          type="text" 
          placeholder="周数 格式 1,2-5,10" 
          value={course.weeks} 
          onChange={(e) => handleChange('weeks', e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [notionApiKey, setNotionApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [semesterName, setSemesterName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>()
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const addCourse = (newCourse: Course) => {
    setCourses([...courses, newCourse]);
  };

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  const importToNotion = async () => {
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notionApiKey, databaseId, semesterName, startDate, courses }),
      });

      if (!response.ok) {
        throw new Error('Failed to import courses');
      }

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error('Error importing courses:', error);
      alert('Error importing courses');
    }
  };

  function getDayOfWeek(dayNumber: number): string {
    const days: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    if (dayNumber < 0 || dayNumber > 6 || !Number.isInteger(dayNumber)) {
      throw new Error('Invalid day number. Please provide a number between 0 and 6.');
    }
    
    return days[dayNumber];
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Notion 课程表导入</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Notion API Key" 
          value={notionApiKey} 
          onChange={(e) => setNotionApiKey(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <input 
          type="text" 
          placeholder="Database ID" 
          value={databaseId} 
          onChange={(e) => setDatabaseId(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input 
          type="text" 
          placeholder="学期名" 
          value={semesterName}
          onChange={(e) => setSemesterName(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <DatePicker
          selected={startDate}
          locale="zh-CN"
          onChange={(date: Date | null) => setStartDate(date)}
          dateFormat="yyyy/MM/dd"
          placeholderText="选择开始日期"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>
      

      <div className="mb-4">
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
        >
          添加课程
        </button>
      </div>

      <CourseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addCourse}
      />

      {courses.map((course, index) => (
        <div key={index} className="mb-4 p-4 border rounded bg-gray-50">
          <h3 className="font-bold">{course.name}</h3>
          <p>备注: {course.remark}</p>
          <p>周数: {course.weeks} {getDayOfWeek(Number(course.day))}</p>
          <p>时间: {course.startTime} - {course.endTime}</p>
          <button 
            onClick={() => removeCourse(index)} 
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-200"
          >
            删除
          </button>
        </div>
      ))}

      <div className="mt-6">
        <button 
          onClick={importToNotion} 
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200"
        >
          导入到 Notion 数据库
        </button>
      </div>
    </div>
  );
}