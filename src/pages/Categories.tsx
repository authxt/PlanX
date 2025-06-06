import { Emoji } from "emoji-picker-react";
import { lazy, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColorPicker, CustomDialogTitle, CustomEmojiPicker, TopBar } from "../components";
import type { Category, UUID } from "../types/user";
import { useTheme } from "@emotion/react";
import { Delete, DeleteRounded, Edit, SaveRounded } from "@mui/icons-material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material";
import { CATEGORY_NAME_MAX_LENGTH } from "../constants";
import { UserContext } from "../contexts/UserContext";
import { useStorageState } from "../hooks/useStorageState";
import {
  ActionButton,
  AddCategoryButton,
  AddContainer,
  CategoriesContainer,
  CategoryContent,
  CategoryElement,
  CategoryElementsContainer,
  CategoryInput,
  DialogBtn,
  EditNameInput,
  StarChecked,
  StarUnchecked,
} from "../styles";
import { generateUUID, getFontColor, showToast } from "../utils";
import { ColorPalette } from "../theme/themeConfig";
import InputThemeProvider from "../contexts/InputThemeProvider";

const NotFound = lazy(() => import("./NotFound"));

const Categories = () => {
  const { user, setUser } = useContext(UserContext);
  const theme = useTheme();

  const [name, setName] = useStorageState<string>("", "catName", "sessionStorage");
  const [nameError, setNameError] = useState<string>("");
  const [emoji, setEmoji] = useStorageState<string | null>(null, "catEmoji", "sessionStorage");
  const [color, setColor] = useStorageState<string>(theme.primary, "catColor", "sessionStorage");

  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<UUID | undefined>();

  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editNameError, setEditNameError] = useState<string>("");
  const [editEmoji, setEditEmoji] = useState<string | null>(null);
  const [editColor, setEditColor] = useState<string>(ColorPalette.purple);

  const n = useNavigate();

  useEffect(() => {
    document.title = "PlanX - Categories";
    if (!user.settings.enableCategories) {
      n("/");
    }
    if (name.length > CATEGORY_NAME_MAX_LENGTH) {
      setNameError(`Name is too long (maximum ${CATEGORY_NAME_MAX_LENGTH} characters)`);
    }
  }, [n, name.length, user.settings]);

  useEffect(() => {
    setEditColor(
      user.categories.find((cat) => cat.id === selectedCategoryId)?.color || ColorPalette.purple,
    );
    setEditName(user.categories.find((cat) => cat.id === selectedCategoryId)?.name || "");
    setEditNameError("");
  }, [selectedCategoryId, user.categories]);

  const handleDelete = (categoryId: UUID | undefined) => {
    // TODO: remove from favs
    if (categoryId) {
      const categoryName =
        user.categories.find((category) => category.id === categoryId)?.name || "";
      const updatedCategories = user.categories.filter((category) => category.id !== categoryId);
      // Remove the category from tasks that have it associated
      const updatedTasks = user.tasks.map((task) => {
        const updatedCategoryList = task.category?.filter((category) => category.id !== categoryId);
        return {
          ...task,
          category: updatedCategoryList,
        };
      });

      setUser({
        ...user,
        categories: updatedCategories,
        tasks: updatedTasks,
      });

      showToast(
        <div>
          Deleted category - <b translate="no">{categoryName}.</b>
        </div>,
      );
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setName(newName);
    if (newName.length > CATEGORY_NAME_MAX_LENGTH) {
      setNameError(`Name is too long (maximum ${CATEGORY_NAME_MAX_LENGTH} characters)`);
    } else {
      setNameError("");
    }
  };

  const handleEditNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setEditName(newName);
    if (newName.length > CATEGORY_NAME_MAX_LENGTH) {
      setEditNameError(`Name is too long (maximum ${CATEGORY_NAME_MAX_LENGTH} characters)`);
    } else {
      setEditNameError("");
    }
  };

  const handleAddCategory = () => {
    if (name !== "") {
      if (name.length > CATEGORY_NAME_MAX_LENGTH) {
        return;
      }
      const newCategory: Category = {
        id: generateUUID(),
        name,
        emoji: emoji !== "" && emoji !== null ? emoji : undefined,
        color,
      };

      showToast(
        <div>
          Added category - <b translate="no">{newCategory.name}</b>
        </div>,
      );

      setUser((prevUser) => ({
        ...prevUser,
        categories: [...prevUser.categories, newCategory],
      }));

      setName("");
      setColor(theme.primary);
      setEmoji("");
    } else {
      showToast("Category name is required.", { type: "error" });
    }
  };

  const handleEditDimiss = () => {
    setSelectedCategoryId(undefined);
    setOpenEditDialog(false);
    setEditColor(theme.primary);
    setEditName("");
    setEditEmoji(null);
  };

  const handleEditCategory = () => {
    if (selectedCategoryId) {
      const updatedCategories = user.categories.map((category) => {
        if (category.id === selectedCategoryId) {
          return {
            ...category,
            name: editName,
            emoji: editEmoji || undefined,
            color: editColor,
          };
        }
        return category;
      });

      const updatedTasks = user.tasks.map((task) => {
        const updatedCategoryList = task.category?.map((category) => {
          if (category.id === selectedCategoryId) {
            return {
              id: selectedCategoryId,
              name: editName,
              emoji: editEmoji || undefined,
              color: editColor,
            };
          }
          return category;
        });

        return {
          ...task,
          category: updatedCategoryList,
        };
      });

      setUser({
        ...user,
        categories: updatedCategories,
        tasks: updatedTasks,
      });

      showToast(
        <div>
          Updated category - <b translate="no">{editName}</b>
        </div>,
      );

      setOpenEditDialog(false);
    }
  };

  const handleAddToFavorites = (category: Category) => {
    setUser((prevUser) => ({
      ...prevUser,
      favoriteCategories: prevUser.favoriteCategories.includes(category.id)
        ? prevUser.favoriteCategories.filter((id) => id !== category.id)
        : [...prevUser.favoriteCategories, category.id],
    }));
  };

  if (!user.settings.enableCategories) {
    return <NotFound message="Categories are not enabled." />;
  }

  return (
    <>
      <TopBar title="Categories" />
      <CategoriesContainer>
        {user.categories.length > 0 ? (
          <CategoryElementsContainer>
            {user.categories.map((category) => {
              const categoryTasks = user.tasks.filter((task) =>
                task.category?.some((cat) => cat.id === category.id),
              );

              const completedTasksCount = categoryTasks.reduce(
                (count, task) => (task.done ? count + 1 : count),
                0,
              );
              const totalTasksCount = categoryTasks.length;
              const completionPercentage =
                totalTasksCount > 0 ? Math.floor((completedTasksCount / totalTasksCount) * 100) : 0;

              const displayPercentage = totalTasksCount > 0 ? `(${completionPercentage}%)` : "";

              return (
                <CategoryElement key={category.id} clr={category.color}>
                  <CategoryContent translate="no">
                    <span>
                      {category.emoji && (
                        <Emoji unified={category.emoji} emojiStyle={user.emojisStyle} />
                      )}
                    </span>
                    &nbsp;
                    <span style={{ wordBreak: "break-all", fontWeight: 600 }}>{category.name}</span>
                    {totalTasksCount > 0 && (
                      <Tooltip title="The percentage of completion of tasks assigned to this category">
                        <span style={{ opacity: 0.8, fontStyle: "italic" }}>
                          {displayPercentage}
                        </span>
                      </Tooltip>
                    )}
                  </CategoryContent>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <ActionButton>
                      <IconButton color="warning" onClick={() => handleAddToFavorites(category)}>
                        {user.favoriteCategories.includes(category.id) ? (
                          <StarChecked color="warning" />
                        ) : (
                          <StarUnchecked color="disabled" />
                        )}
                      </IconButton>
                    </ActionButton>
                    <ActionButton>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setOpenEditDialog(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </ActionButton>
                    <ActionButton>
                      <IconButton
                        color="error"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          if (
                            totalTasksCount > 0 ||
                            user.favoriteCategories.includes(category.id)
                          ) {
                            // Open delete dialog if there are tasks associated to catagory or if it's a favorite
                            setOpenDeleteDialog(true);
                          } else {
                            // If no associated tasks, directly handle deletion
                            handleDelete(category.id);
                          }
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </ActionButton>
                  </div>
                </CategoryElement>
              );
            })}
          </CategoryElementsContainer>
        ) : (
          <p>You don't have any categories</p>
        )}
        <AddContainer>
          <h2>Add New Category</h2>
          <CustomEmojiPicker
            emoji={typeof emoji === "string" ? emoji : undefined}
            setEmoji={setEmoji}
            color={color}
            name={name}
            type="category"
          />
          <InputThemeProvider>
            <CategoryInput
              required
              label="Category name"
              placeholder="Enter category name"
              value={name}
              onChange={handleNameChange}
              error={nameError !== ""}
              helperText={
                name == ""
                  ? undefined
                  : !nameError
                    ? `${name.length}/${CATEGORY_NAME_MAX_LENGTH}`
                    : nameError
              }
            />
          </InputThemeProvider>
          <ColorPicker
            color={color}
            onColorChange={(color) => {
              setColor(color);
            }}
            width={400}
            fontColor={getFontColor(theme.secondary)}
          />
          <AddCategoryButton
            onClick={handleAddCategory}
            disabled={name.length > CATEGORY_NAME_MAX_LENGTH}
          >
            Create Category
          </AddCategoryButton>
        </AddContainer>
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          slotProps={{
            paper: {
              style: {
                borderRadius: "24px",
                padding: "12px",
                maxWidth: "600px",
              },
            },
          }}
        >
          <DialogTitle>
            Confirm deletion of{" "}
            <b>{user.categories.find((cat) => cat.id === selectedCategoryId)?.name}</b>
          </DialogTitle>

          <DialogContent>
            This will remove the category from your list and associated tasks.
          </DialogContent>

          <DialogActions>
            <DialogBtn onClick={() => setOpenDeleteDialog(false)}>Cancel</DialogBtn>
            <DialogBtn
              onClick={() => {
                handleDelete(selectedCategoryId);
                setOpenDeleteDialog(false);
              }}
              color="error"
            >
              <DeleteRounded /> &nbsp; Delete
            </DialogBtn>
          </DialogActions>
        </Dialog>
        {/* Edit Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={handleEditDimiss}
          slotProps={{
            paper: {
              style: {
                borderRadius: "24px",
                padding: "12px",
                minWidth: "350px",
              },
            },
          }}
        >
          <CustomDialogTitle
            title="Edit Category"
            subTitle={`Edit the details of the category.`}
            icon={<Edit />}
            onClose={handleEditDimiss}
          />

          <DialogContent>
            <CustomEmojiPicker
              emoji={
                user.categories.find((cat) => cat.id === selectedCategoryId)?.emoji || undefined
              }
              setEmoji={setEditEmoji}
              color={editColor}
              name={editName}
              type="category"
            />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <EditNameInput
                label="Enter category name"
                placeholder="Enter category name"
                value={editName}
                error={editNameError !== "" || editName.length === 0}
                onChange={handleEditNameChange}
                helperText={
                  editNameError
                    ? editNameError
                    : editName.length === 0
                      ? "Category name is required"
                      : `${editName.length}/${CATEGORY_NAME_MAX_LENGTH}`
                }
              />
              <ColorPicker
                color={editColor}
                width="350px"
                fontColor={theme.darkmode ? ColorPalette.fontLight : ColorPalette.fontDark}
                onColorChange={(clr) => {
                  setEditColor(clr);
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <DialogBtn onClick={handleEditDimiss}>Cancel</DialogBtn>
            <DialogBtn
              onClick={handleEditCategory}
              disabled={editNameError !== "" || editName.length === 0}
            >
              <SaveRounded /> &nbsp; Save
            </DialogBtn>
          </DialogActions>
        </Dialog>
      </CategoriesContainer>
    </>
  );
};

export default Categories;
