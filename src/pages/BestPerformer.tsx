import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { trackPageView } from '../utils/analytics';
import Button from '../components/Button';
import Alert from '../components/Alert';

interface Student {
  id: string;
  name: string;
  email: string;
  points: number;
  batchCode?: string;
  groupName?: string;
}

interface BestPerformer {
  student: Student;
  points: number;
  rank: number;
  category: 'best' | 'star' | 'outstanding';
  achievements: string[];
}

export default function BestPerformerPage() {
  const [bestPerformers, setBestPerformers] = useState<BestPerformer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth] = useState(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertTone, setAlertTone] = useState<"success" | "error" | "info" | "warning">("info");

  useEffect(() => {
    trackPageView('Best Performer');
    
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    // Fetch all students from all batches
    const unsub = onSnapshot(collection(db, 'batches'), (snap) => {
      const allStudents: Student[] = [];
      snap.docs.forEach((doc) => {
        const batch = { id: doc.id, ...(doc.data() as any) };
        if (batch.students && Array.isArray(batch.students)) {
          batch.students.forEach((student: any) => {
            allStudents.push({
              ...student,
              batchCode: batch.code,
              groupName: batch.groupName
            });
          });
        }
      });
      
      // Sort by points and get top performers
      const sortedStudents = allStudents
        .filter(s => s.points && s.points > 0)
        .sort((a, b) => (b.points || 0) - (a.points || 0));
      
      
      // Create best performers list with achievements
      const performers: BestPerformer[] = sortedStudents.slice(0, 10).map((student, index) => {
        const category = getCategory(index + 1);
        return {
          student,
          points: student.points || 0,
          rank: index + 1,
          category,
          achievements: generateAchievements(student.points || 0, index + 1, category)
        };
      });
      
      setBestPerformers(performers);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getCategory = (rank: number): 'best' | 'star' | 'outstanding' => {
    if (rank === 1) return 'best';
    if (rank <= 3) return 'star';
    return 'outstanding';
  };

  const generateAchievements = (points: number, rank: number, category: 'best' | 'star' | 'outstanding'): string[] => {
    const achievements: string[] = [];
    
    // Category-specific achievements
    if (category === 'best') {
      achievements.push('🏆 Best Performer');
      achievements.push('👑 Excellence Award');
    } else if (category === 'star') {
      achievements.push('⭐ Star Performer');
      achievements.push('🌟 Rising Star');
    } else {
      achievements.push('🌟 Outstanding Performer');
      achievements.push('💫 Exceptional Achievement');
    }
    
    // Rank-based achievements
    if (rank === 1) {
      achievements.push('🥇 #1 Position');
    } else if (rank <= 3) {
      achievements.push('🥈 Top 3');
    } else if (rank <= 5) {
      achievements.push('🥉 Top 5');
    }
    
    // Points-based achievements
    if (points >= 1000) {
      achievements.push('💎 Diamond Level');
    } else if (points >= 800) {
      achievements.push('👑 Gold Level');
    } else if (points >= 600) {
      achievements.push('🥉 Silver Level');
    } else if (points >= 400) {
      achievements.push('🌟 Bronze Level');
    }
    
    if (points >= 500) {
      achievements.push('🎯 High Achiever');
    }
    
    if (points >= 300) {
      achievements.push('📈 Consistent Performer');
    }
    
    return achievements;
  };

  const openModal = () => {
    setShowModal(true);
    setAlertMsg("🎉 Best Performers of the Month!");
    setAlertTone("success");
    setTimeout(() => setAlertMsg(""), 3000);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="space-y-6">
          {alertMsg && <Alert tone={alertTone}>{alertMsg}</Alert>}

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🏆 Performance Recognition
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Best, Star & Outstanding Performers for {selectedMonth}
              </p>
              <Button 
                onClick={openModal}
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                🎉 Show All Performers
              </Button>
            </div>

            {/* Category Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-white text-center">
                <div className="text-3xl font-bold">{bestPerformers.filter(p => p.category === 'best').length}</div>
                <div className="text-sm opacity-90">🏆 Best Performers</div>
              </div>
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg p-6 text-white text-center">
                <div className="text-3xl font-bold">{bestPerformers.filter(p => p.category === 'star').length}</div>
                <div className="text-sm opacity-90">⭐ Star Performers</div>
              </div>
              <div className="bg-gradient-to-r from-green-400 to-teal-500 rounded-lg p-6 text-white text-center">
                <div className="text-3xl font-bold">{bestPerformers.filter(p => p.category === 'outstanding').length}</div>
                <div className="text-sm opacity-90">🌟 Outstanding Performers</div>
              </div>
            </div>

            {/* Category Previews */}
            {bestPerformers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Category Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Best Performer */}
                  {bestPerformers.filter(p => p.category === 'best').slice(0, 1).map((performer) => (
                    <div 
                      key={performer.student.id}
                      className="rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                    >
                      <div className="text-4xl mb-2">🏆</div>
                      <div className="text-lg font-semibold mb-1">Best Performer</div>
                      <div className="text-xl font-bold mb-2">{performer.student.name}</div>
                      <div className="text-sm opacity-90 mb-2">{performer.student.batchCode}</div>
                      <div className="text-2xl font-bold">{performer.points} pts</div>
                    </div>
                  ))}
                  
                  {/* Star Performers */}
                  {bestPerformers.filter(p => p.category === 'star').slice(0, 1).map((performer) => (
                    <div 
                      key={performer.student.id}
                      className="rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-400 to-purple-500 text-white"
                    >
                      <div className="text-4xl mb-2">⭐</div>
                      <div className="text-lg font-semibold mb-1">Star Performer</div>
                      <div className="text-xl font-bold mb-2">{performer.student.name}</div>
                      <div className="text-sm opacity-90 mb-2">{performer.student.batchCode}</div>
                      <div className="text-2xl font-bold">{performer.points} pts</div>
                    </div>
                  ))}
                  
                  {/* Outstanding Performers */}
                  {bestPerformers.filter(p => p.category === 'outstanding').slice(0, 1).map((performer) => (
                    <div 
                      key={performer.student.id}
                      className="rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-green-400 to-teal-500 text-white"
                    >
                      <div className="text-4xl mb-2">🌟</div>
                      <div className="text-lg font-semibold mb-1">Outstanding Performer</div>
                      <div className="text-xl font-bold mb-2">{performer.student.name}</div>
                      <div className="text-sm opacity-90 mb-2">{performer.student.batchCode}</div>
                      <div className="text-2xl font-bold">{performer.points} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-pulse"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white text-center">
              <h2 className="text-3xl font-bold mb-2">🏆 Performance Recognition</h2>
              <p className="text-lg opacity-90">Best, Star & Outstanding Performers - {selectedMonth}</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {bestPerformers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Data Available</h3>
                  <p className="text-gray-500">No student performance data found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Best Performers */}
                  {bestPerformers.filter(p => p.category === 'best').length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        🏆 Best Performers
                      </h3>
                      <div className="space-y-3">
                        {bestPerformers.filter(p => p.category === 'best').map((performer, index) => (
                          <div 
                            key={performer.student.id}
                            className="p-4 rounded-lg border-2 border-yellow-400 bg-yellow-50 transition-all duration-500 transform hover:scale-105"
                            style={{
                              animationDelay: `${index * 100}ms`,
                              animation: 'slideInUp 0.6s ease-out forwards'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="text-3xl">🏆</div>
                                <div>
                                  <div className="text-xl font-bold text-gray-900">{performer.student.name}</div>
                                  <div className="text-sm text-gray-600">{performer.student.batchCode}</div>
                                  {performer.student.groupName && (
                                    <div className="text-xs text-gray-500">{performer.student.groupName}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">{performer.points} pts</div>
                                <div className="text-sm text-gray-600">Rank #{performer.rank}</div>
                              </div>
                            </div>
                            
                            {/* Achievements */}
                            {performer.achievements.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {performer.achievements.map((achievement, achIndex) => (
                                  <span 
                                    key={achIndex}
                                    className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium rounded-full"
                                  >
                                    {achievement}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Star Performers */}
                  {bestPerformers.filter(p => p.category === 'star').length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        ⭐ Star Performers
                      </h3>
                      <div className="space-y-3">
                        {bestPerformers.filter(p => p.category === 'star').map((performer, index) => (
                          <div 
                            key={performer.student.id}
                            className="p-4 rounded-lg border-2 border-blue-400 bg-blue-50 transition-all duration-500 transform hover:scale-105"
                            style={{
                              animationDelay: `${index * 100}ms`,
                              animation: 'slideInUp 0.6s ease-out forwards'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="text-3xl">⭐</div>
                                <div>
                                  <div className="text-xl font-bold text-gray-900">{performer.student.name}</div>
                                  <div className="text-sm text-gray-600">{performer.student.batchCode}</div>
                                  {performer.student.groupName && (
                                    <div className="text-xs text-gray-500">{performer.student.groupName}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">{performer.points} pts</div>
                                <div className="text-sm text-gray-600">Rank #{performer.rank}</div>
                              </div>
                            </div>
                            
                            {/* Achievements */}
                            {performer.achievements.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {performer.achievements.map((achievement, achIndex) => (
                                  <span 
                                    key={achIndex}
                                    className="px-3 py-1 bg-gradient-to-r from-blue-400 to-purple-500 text-white text-xs font-medium rounded-full"
                                  >
                                    {achievement}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outstanding Performers */}
                  {bestPerformers.filter(p => p.category === 'outstanding').length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        🌟 Outstanding Performers
                      </h3>
                      <div className="space-y-3">
                        {bestPerformers.filter(p => p.category === 'outstanding').map((performer, index) => (
                          <div 
                            key={performer.student.id}
                            className="p-4 rounded-lg border-2 border-green-400 bg-green-50 transition-all duration-500 transform hover:scale-105"
                            style={{
                              animationDelay: `${index * 100}ms`,
                              animation: 'slideInUp 0.6s ease-out forwards'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="text-3xl">🌟</div>
                                <div>
                                  <div className="text-xl font-bold text-gray-900">{performer.student.name}</div>
                                  <div className="text-sm text-gray-600">{performer.student.batchCode}</div>
                                  {performer.student.groupName && (
                                    <div className="text-xs text-gray-500">{performer.student.groupName}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">{performer.points} pts</div>
                                <div className="text-sm text-gray-600">Rank #{performer.rank}</div>
                              </div>
                            </div>
                            
                            {/* Achievements */}
                            {performer.achievements.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {performer.achievements.map((achievement, achIndex) => (
                                  <span 
                                    key={achIndex}
                                    className="px-3 py-1 bg-gradient-to-r from-green-400 to-teal-500 text-white text-xs font-medium rounded-full"
                                  >
                                    {achievement}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <Button 
                onClick={closeModal}
                variant="secondary"
                className="px-6 py-2"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  // Add share functionality here
                  setAlertMsg("Share functionality coming soon!");
                  setAlertTone("info");
                  setTimeout(() => setAlertMsg(""), 3000);
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              >
                📤 Share
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
