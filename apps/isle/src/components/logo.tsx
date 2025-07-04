import {
  chakra,
  defineSlotRecipe,
  Image,
  type RecipeVariantProps,
  useSlotRecipe,
} from "@chakra-ui/react";

const logo = defineSlotRecipe({
  slots: ["root", "image"],
  base: {
    root: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      rounded: "full",
      aspectRatio: "1/1",
      bg: "black",
      border: "1px solid {colors.gray.900}",
    },
  },
  variants: {
    size: {
      sm: {
        root: {
          width: 8,
          height: 8,
        },
        image: {
          width: 4,
          height: 4,
        },
      },
      md: {
        root: {
          width: 12,
          height: 12,
        },
        image: {
          width: 6,
          height: 6,
        },
      },
      lg: {
        root: {
          width: "60px",
          height: "60px",
        },
        image: {
          width: 8,
          height: 8,
        },
      },
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

type LogoRecipeProps = RecipeVariantProps<typeof logo>;

interface LogoProps extends LogoRecipeProps {}

export function Logo(props: LogoProps) {
  const recipe = useSlotRecipe({
    recipe: logo,
  });

  const [recipeProps] = recipe.splitVariantProps(props);
  const styles = recipe(recipeProps);

  return (
    <chakra.div css={styles.root}>
      <Image src="/logo.svg" alt="idOS Isle" css={styles.image} />
    </chakra.div>
  );
}
