import type { CategoryId } from "@/entities/category";
import type { ProductCategoryId } from "@/entities/product";

type Equal<Left, Right> = [Left] extends [Right] ? ([Right] extends [Left] ? true : false) : false;

type Expect<Condition extends true> = Condition;

type _ProductCategoryIdMatchesCategoryId = Expect<Equal<ProductCategoryId, CategoryId>>;
