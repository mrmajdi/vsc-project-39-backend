import { Request, Response, NextFunction } from 'express';
import petService from '../services/pet.service';

export const getPublicPet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { uniqueCode } = req.params;
    const pet = await petService.getPublicPet(uniqueCode);
    if (!pet) {
      return res.status(404).json({ message: 'حيوان یافت نشد' });
    }
    res.json(pet);
  } catch (error) {
    next(error);
  }
};

export const listPets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'کاربر احراز هویت نشده' });
    }
    const pets = await petService.listUserPets(userId);
    res.json(pets);
  } catch (error) {
    next(error);
  }
};

export const createPet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'کاربر احراز هویت نشده' });
    }
    const pet = await petService.createPet(userId, req.body);
    res.status(201).json(pet);
  } catch (error) {
    next(error);
  }
};

export const updatePet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const pet = await petService.updatePet(id, req.body);
    if (!pet) {
      return res.status(404).json({ message: 'حيوان یافت نشد' });
    }
    res.json(pet);
  } catch (error) {
    next(error);
  }
};

export const deletePet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await petService.deletePet(id);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const getPassport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const passport = await petService.getPassport(id);
    if (!passport) {
      return res.status(404).json({ message: 'پاسپورت یافت نشد' });
    }
    res.json(passport);
  } catch (error) {
    next(error);
  }
};
