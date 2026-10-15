/** Only reviewed, redistributable, self-contained GLB files belong here.
 * Each animation must be checked by a qualified trainer before release.
 * Never substitute a static mesh or a generic movement for the named exercise.
 */
export interface ExerciseAnimation {
  exerciseId: string;
  url: string;
  clip: string;
  license: string;
  source: string;
  reviewedBy: string;
  reviewDate: string;
}
// No licensed, anatomically reviewed motion asset was supplied with this project.
export const animationAssets: Readonly<Record<string, ExerciseAnimation>> = {};
