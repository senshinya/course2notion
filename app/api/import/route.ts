import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

function parseWeeks(weeksString: string): number[] {
  const weeks: number[] = [];
  const parts = weeksString.split(',');
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        weeks.push(i);
      }
    } else {
      weeks.push(Number(part));
    }
  }
  
  return weeks;
}

function formatDateTimeWithTimeZone(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  
  // 创建一个代表 Asia/Shanghai 时区的时间字符串
  const shanghaiDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+08:00`;

  // 直接返回这个字符串，它已经是正确的 ISO 8601 格式，包含了 Asia/Shanghai 时区信息
  return shanghaiDateString;
}

export async function POST(request: Request) {
  const { notionApiKey, databaseId, semesterName, startDate, courses } = await request.json();

  console.log(courses)
  if (!notionApiKey || !databaseId || !semesterName || !startDate || !courses) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const notion = new Client({ auth: notionApiKey });

  const startDateObj = new Date(startDate);

  for (const course of courses) {
    const weeks = parseWeeks(course.weeks);
    const dayOffset = Number(course.day);

    for (const week of weeks) {
      const courseDate = new Date(startDateObj.getTime());
      courseDate.setDate(courseDate.getDate() + (week - 1) * 7 + dayOffset);

      const startDateTime = formatDateTimeWithTimeZone(courseDate, course.startTime);
      const endDateTime = formatDateTimeWithTimeZone(courseDate, course.endTime);

      try {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            名称: {
              title: [
                {
                  text: {
                    content: `${course.name}`
                  }
                }
              ]
            },
            备注: { rich_text: [{ text: { content: course.remark } }] },
            日期: { date: { start: startDateTime, end: endDateTime } },
            学期: { rich_text: [{ text: { content: semesterName } }] }
          }
        });
      } catch (error) {
        console.error('Error creating Notion page:', error);
      }
    }
  }

  return NextResponse.json({ message: 'Course pages created successfully' });
}