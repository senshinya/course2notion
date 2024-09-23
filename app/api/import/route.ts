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
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  
  // 格式化为有效的 ISO 8601 字符串
  return newDate.toLocaleString('en-US', { 
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '\$3-\$1-\$2T\$4:\$5:\$6+08:00');
}

export async function POST(request: Request) {
  const { notionApiKey, databaseId, semesterName, startDate, courses } = await request.json();

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