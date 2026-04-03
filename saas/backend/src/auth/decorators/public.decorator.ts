import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Routes sans JWT (login, register, etc.) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
