import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getCallsByCallId = async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    
    if (!callId) {
      return res.status(400).json({ 
        error: 'Call ID не указан' 
      });
    }

    console.log(`🔍 Поиск записей звонков для Call ID: ${callId}`);

    // Парсим call_id - может быть одиночный ID или список через запятую
    const callIds = callId.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    console.log(`🔢 Парсированные ID: ${callIds}`);

    // Получаем записи звонков по call_id
    const calls = await prisma.call.findMany({
      where: {
        id: {
          in: callIds // Ищем по массиву ID в таблице calls
        }
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      },
      orderBy: {
        dateCreate: 'desc'
      }
    });

    console.log(`📞 Найдено записей звонков: ${calls.length}`);
    if (calls.length > 0) {
      console.log('📋 Записи:', calls.map(call => ({ id: call.id, rk: call.rk, status: call.status })));
    }

    res.json({
      success: true,
      calls
    });
  } catch (error) {
    console.error('Ошибка при получении записей звонков:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера при получении записей звонков' 
    });
  }
};

export const getAllCalls = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, status, operatorId } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (operatorId) {
      where.operatorId = Number(operatorId);
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              city: true
            }
          }
        },
        orderBy: {
          dateCreate: 'desc'
        },
        skip: offset,
        take: Number(limit)
      }),
      prisma.call.count({ where })
    ]);

    res.json({
      success: true,
      calls,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Ошибка при получении списка звонков:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера при получении списка звонков' 
    });
  }
};

export const getCallById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const call = await prisma.call.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    if (!call) {
      return res.status(404).json({ 
        error: 'Запись звонка не найдена' 
      });
    }

    res.json({
      success: true,
      call
    });
  } catch (error) {
    console.error('Ошибка при получении записи звонка:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера при получении записи звонка' 
    });
  }
};
